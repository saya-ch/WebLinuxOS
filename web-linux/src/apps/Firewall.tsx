import { useState, useEffect, useRef, useCallback } from 'react'

interface FirewallRule {
  id: string
  name: string
  direction: 'inbound' | 'outbound'
  protocol: 'TCP' | 'UDP' | 'ICMP' | 'ALL'
  port: string
  action: 'allow' | 'deny'
  source: string
  enabled: boolean
}

interface Connection {
  id: string
  srcIp: string
  dstIp: string
  port: number
  protocol: string
  status: 'ESTABLISHED' | 'TIME_WAIT' | 'CLOSE_WAIT' | 'SYN_SENT'
  traffic: string
}

interface BlockedLog {
  id: string
  timestamp: string
  srcIp: string
  dstIp: string
  port: number
  protocol: string
  rule: string
}

interface PortScan {
  id: string
  srcIp: string
  ports: number[]
  startTime: string
  status: 'active' | 'stopped'
}

const presetRules: FirewallRule[] = [
  { id: '1', name: '允许 SSH', direction: 'inbound', protocol: 'TCP', port: '22', action: 'allow', source: 'any', enabled: true },
  { id: '2', name: '允许 HTTP', direction: 'inbound', protocol: 'TCP', port: '80', action: 'allow', source: 'any', enabled: true },
  { id: '3', name: '允许 HTTPS', direction: 'inbound', protocol: 'TCP', port: '443', action: 'allow', source: 'any', enabled: true },
  { id: '4', name: '允许 DNS', direction: 'outbound', protocol: 'UDP', port: '53', action: 'allow', source: 'any', enabled: true },
  { id: '5', name: '阻止 Telnet', direction: 'inbound', protocol: 'TCP', port: '23', action: 'deny', source: 'any', enabled: true },
  { id: '6', name: '阻止 FTP', direction: 'inbound', protocol: 'TCP', port: '21', action: 'deny', source: 'any', enabled: true },
  { id: '7', name: '允许 MySQL', direction: 'inbound', protocol: 'TCP', port: '3306', action: 'allow', source: '192.168.1.0/24', enabled: false },
  { id: '8', name: '允许 PostgreSQL', direction: 'inbound', protocol: 'TCP', port: '5432', action: 'allow', source: '10.0.0.0/8', enabled: false },
  { id: '9', name: '允许 PING', direction: 'inbound', protocol: 'ICMP', port: '-', action: 'allow', source: 'any', enabled: true },
  { id: '10', name: '默认入站拒绝', direction: 'inbound', protocol: 'ALL', port: '-', action: 'deny', source: 'any', enabled: true },
]

const templates = [
  { name: 'Web 服务器', rules: ['允许 HTTP', '允许 HTTPS', '允许 SSH', '默认入站拒绝'] },
  { name: '数据库服务器', rules: ['允许 SSH', '允许 MySQL', '允许 PostgreSQL', '默认入站拒绝'] },
  { name: '桌面工作站', rules: ['允许 SSH', '允许 HTTP', '允许 HTTPS', '允许 DNS', '允许 PING', '阻止 FTP', '默认入站拒绝'] },
]

function randomIp(): string {
  return `${10 + Math.floor(Math.random() * 240)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${1 + Math.floor(Math.random() * 254)}`
}

function randomTraffic(): string {
  const v = Math.random() * 1024 * 1024
  if (v < 1024) return `${v.toFixed(0)} B`
  if (v < 1048576) return `${(v / 1024).toFixed(1)} KB`
  return `${(v / 1048576).toFixed(1)} MB`
}

function generateConnections(): Connection[] {
  const ports = [22, 80, 443, 3306, 5432, 8080, 53]
  const statuses: Connection['status'][] = ['ESTABLISHED', 'TIME_WAIT', 'CLOSE_WAIT', 'SYN_SENT']
  const count = 5 + Math.floor(Math.random() * 8)
  return Array.from({ length: count }, (_, i) => ({
    id: `conn-${Date.now()}-${i}`,
    srcIp: randomIp(),
    dstIp: `192.168.1.${1 + Math.floor(Math.random() * 10)}`,
    port: ports[Math.floor(Math.random() * ports.length)],
    protocol: Math.random() > 0.3 ? 'TCP' : 'UDP',
    status: statuses[Math.floor(Math.random() * statuses.length)],
    traffic: randomTraffic(),
  }))
}

function generateBlockedLog(rules: FirewallRule[]): BlockedLog {
  const denyRules = rules.filter((r) => r.action === 'deny' && r.enabled)
  const rule = denyRules.length > 0 ? denyRules[Math.floor(Math.random() * denyRules.length)] : null
  const now = new Date()
  return {
    id: `log-${Date.now()}-${Math.random()}`,
    timestamp: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`,
    srcIp: randomIp(),
    dstIp: `192.168.1.${1 + Math.floor(Math.random() * 10)}`,
    port: rule && rule.port !== '-' ? parseInt(rule.port) : 20 + Math.floor(Math.random() * 100),
    protocol: rule ? rule.protocol : 'TCP',
    rule: rule ? rule.name : '默认拒绝',
  }
}

function generatePortScan(): PortScan {
  const portCount = 3 + Math.floor(Math.random() * 8)
  const ports: number[] = []
  for (let i = 0; i < portCount; i++) {
    ports.push(20 + Math.floor(Math.random() * 1000))
  }
  const now = new Date()
  return {
    id: `scan-${Date.now()}`,
    srcIp: randomIp(),
    ports: [...new Set(ports)].sort((a, b) => a - b),
    startTime: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`,
    status: Math.random() > 0.5 ? 'active' : 'stopped',
  }
}

type TabType = 'rules' | 'connections' | 'logs' | 'traffic' | 'scans'

export default function Firewall() {
  const [rules, setRules] = useState<FirewallRule[]>(presetRules)
  const [firewallOn, setFirewallOn] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newRule, setNewRule] = useState<Partial<FirewallRule>>({
    direction: 'inbound', protocol: 'TCP', action: 'allow', source: 'any',
  })
  const [tab, setTab] = useState<'all' | 'inbound' | 'outbound'>('all')
  const [mainTab, setMainTab] = useState<TabType>('rules')
  const [connections, setConnections] = useState<Connection[]>([])
  const [blockedLogs, setBlockedLogs] = useState<BlockedLog[]>([])
  const [portScans, setPortScans] = useState<PortScan[]>([])
  const [trafficData, setTrafficData] = useState<Record<number, number>>({})
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!firewallOn) return
    const timer = setInterval(() => {
      setConnections(generateConnections())
      if (Math.random() > 0.4) {
        setBlockedLogs((prev) => {
          const next = [generateBlockedLog(rules), ...prev].slice(0, 50)
          return next
        })
      }
      if (Math.random() > 0.8) {
        setPortScans((prev) => {
          const next = [generatePortScan(), ...prev].slice(0, 20)
          return next
        })
      }
      setTrafficData((prev) => {
        const ports = [22, 80, 443, 3306, 5432, 8080, 53]
        const next: Record<number, number> = {}
        for (const p of ports) {
          next[p] = (prev[p] || 0) * 0.7 + Math.random() * 500
        }
        return next
      })
    }, 3000)
    return () => clearInterval(timer)
  }, [firewallOn, rules])

  useEffect(() => {
    if (mainTab !== 'traffic' || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)
    const w = rect.width
    const h = rect.height
    ctx.clearRect(0, 0, w, h)
    const ports = Object.keys(trafficData).map(Number).sort((a, b) => a - b)
    if (ports.length === 0) return
    const maxVal = Math.max(...ports.map((p) => trafficData[p]), 1)
    const barW = Math.min(40, (w - 60) / ports.length - 8)
    const chartH = h - 50
    ctx.fillStyle = '#6c7086'
    ctx.font = '11px sans-serif'
    ctx.fillText('端口流量统计', 10, 18)
    for (let i = 0; i < ports.length; i++) {
      const x = 30 + i * (barW + 8)
      const val = trafficData[ports[i]]
      const barH = (val / maxVal) * (chartH - 30)
      const gradient = ctx.createLinearGradient(x, chartH - barH, x, chartH)
      gradient.addColorStop(0, '#89b4fa')
      gradient.addColorStop(1, '#313244')
      ctx.fillStyle = gradient
      ctx.fillRect(x, chartH - barH, barW, barH)
      ctx.fillStyle = '#a6adc8'
      ctx.font = '10px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(String(ports[i]), x + barW / 2, chartH + 14)
      ctx.fillStyle = '#cdd6f4'
      ctx.fillText(`${Math.round(val)}`, x + barW / 2, chartH - barH - 6)
    }
    ctx.textAlign = 'left'
  }, [mainTab, trafficData])

  const toggleRule = (id: string) => {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)))
  }

  const deleteRule = (id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id))
  }

  const addRule = () => {
    if (!newRule.name || !newRule.port) return
    setRules((prev) => [
      ...prev,
      {
        id: `rule-${Date.now()}`,
        name: newRule.name || '',
        direction: (newRule.direction as 'inbound' | 'outbound') || 'inbound',
        protocol: (newRule.protocol as FirewallRule['protocol']) || 'TCP',
        port: newRule.port || '-',
        action: (newRule.action as 'allow' | 'deny') || 'allow',
        source: newRule.source || 'any',
        enabled: true,
      },
    ])
    setNewRule({ direction: 'inbound', protocol: 'TCP', action: 'allow', source: 'any' })
    setShowAdd(false)
  }

  const applyTemplate = (templateName: string) => {
    const template = templates.find((t) => t.name === templateName)
    if (!template) return
    setRules((prev) =>
      prev.map((r) => ({
        ...r,
        enabled: template.rules.includes(r.name),
      }))
    )
  }

  const moveRule = useCallback((id: string, dir: 'up' | 'down') => {
    setRules((prev) => {
      const idx = prev.findIndex((r) => r.id === id)
      if (idx < 0) return prev
      if (dir === 'up' && idx === 0) return prev
      if (dir === 'down' && idx === prev.length - 1) return prev
      const next = [...prev]
      const swapIdx = dir === 'up' ? idx - 1 : idx + 1
      ;[next[idx], next[swapIdx]] = [next[swapIdx], next[idx]]
      return next
    })
  }, [])

  const exportRules = useCallback(() => {
    const json = JSON.stringify(rules, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'firewall-rules.json'
    a.click()
    URL.revokeObjectURL(url)
  }, [rules])

  const importRules = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string)
          if (Array.isArray(data)) {
            setRules(data as FirewallRule[])
          }
        } catch { /* ignore */ }
      }
      reader.readAsText(file)
    }
    input.click()
  }, [])

  const filtered = rules.filter((r) => {
    if (tab === 'inbound' && r.direction !== 'inbound') return false
    if (tab === 'outbound' && r.direction !== 'outbound') return false
    return true
  })

  const mainTabs: { key: TabType; label: string }[] = [
    { key: 'rules', label: '规则' },
    { key: 'connections', label: '连接' },
    { key: 'logs', label: '日志' },
    { key: 'traffic', label: '流量' },
    { key: 'scans', label: '扫描' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1e1e2e', color: '#cdd6f4' }}>
      <div style={{ padding: '10px 12px', borderBottom: '1px solid #313244', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 600, fontSize: '13px' }}>防火墙</span>
          <button
            onClick={() => setFirewallOn(!firewallOn)}
            style={{
              width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer',
              background: firewallOn ? '#a6e3a1' : '#f38ba8', position: 'relative',
            }}
          >
            <div style={{
              width: '18px', height: '18px', borderRadius: '50%', background: '#fff',
              position: 'absolute', top: '3px', left: firewallOn ? '23px' : '3px', transition: 'left 0.2s',
            }} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: '4px', marginLeft: '8px' }}>
          {mainTabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setMainTab(t.key)}
              style={{
                padding: '4px 10px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px',
                background: mainTab === t.key ? '#89b4fa' : '#313244',
                color: mainTab === t.key ? '#1e1e2e' : '#cdd6f4',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {mainTab === 'rules' && (
        <>
          <div style={{ padding: '8px 12px', borderBottom: '1px solid #313244', display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', color: '#a6adc8' }}>筛选:</span>
            {['all', 'inbound', 'outbound'].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t as typeof tab)}
                style={{
                  padding: '3px 8px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '10px',
                  background: tab === t ? '#89b4fa' : '#313244',
                  color: tab === t ? '#1e1e2e' : '#cdd6f4',
                }}
              >
                {t === 'all' ? '全部' : t === 'inbound' ? '入站' : '出站'}
              </button>
            ))}
            <span style={{ fontSize: '11px', color: '#a6adc8', marginLeft: '8px' }}>模板:</span>
            {templates.map((t) => (
              <button
                key={t.name}
                onClick={() => applyTemplate(t.name)}
                style={{
                  padding: '3px 8px', background: '#313244', color: '#cdd6f4',
                  border: '1px solid #45475a', borderRadius: '4px', cursor: 'pointer', fontSize: '10px',
                }}
              >
                {t.name}
              </button>
            ))}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
              <button
                onClick={() => setShowAdd(!showAdd)}
                style={{
                  padding: '3px 8px', background: '#a6e3a1', color: '#1e1e2e',
                  border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '10px',
                }}
              >
                + 添加规则
              </button>
              <button
                onClick={exportRules}
                style={{
                  padding: '3px 8px', background: '#89b4fa', color: '#1e1e2e',
                  border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '10px',
                }}
              >
                导出
              </button>
              <button
                onClick={importRules}
                style={{
                  padding: '3px 8px', background: '#f9e2af', color: '#1e1e2e',
                  border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '10px',
                }}
              >
                导入
              </button>
            </div>
          </div>

          {showAdd && (
            <div style={{ padding: '10px 12px', borderBottom: '1px solid #313244', background: '#181825', display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                placeholder="规则名称"
                value={newRule.name || ''}
                onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                style={{ padding: '4px 8px', background: '#313244', border: '1px solid #45475a', borderRadius: '4px', color: '#cdd6f4', fontSize: '11px', width: '120px', outline: 'none' }}
              />
              <select
                value={newRule.direction}
                onChange={(e) => setNewRule({ ...newRule, direction: e.target.value as 'inbound' | 'outbound' })}
                style={{ padding: '4px 8px', background: '#313244', border: '1px solid #45475a', borderRadius: '4px', color: '#cdd6f4', fontSize: '11px', outline: 'none' }}
              >
                <option value="inbound">入站</option>
                <option value="outbound">出站</option>
              </select>
              <select
                value={newRule.protocol}
                onChange={(e) => setNewRule({ ...newRule, protocol: e.target.value as FirewallRule['protocol'] })}
                style={{ padding: '4px 8px', background: '#313244', border: '1px solid #45475a', borderRadius: '4px', color: '#cdd6f4', fontSize: '11px', outline: 'none' }}
              >
                <option value="TCP">TCP</option>
                <option value="UDP">UDP</option>
                <option value="ICMP">ICMP</option>
                <option value="ALL">ALL</option>
              </select>
              <input
                placeholder="端口"
                value={newRule.port || ''}
                onChange={(e) => setNewRule({ ...newRule, port: e.target.value })}
                style={{ padding: '4px 8px', background: '#313244', border: '1px solid #45475a', borderRadius: '4px', color: '#cdd6f4', fontSize: '11px', width: '70px', outline: 'none' }}
              />
              <select
                value={newRule.action}
                onChange={(e) => setNewRule({ ...newRule, action: e.target.value as 'allow' | 'deny' })}
                style={{ padding: '4px 8px', background: '#313244', border: '1px solid #45475a', borderRadius: '4px', color: '#cdd6f4', fontSize: '11px', outline: 'none' }}
              >
                <option value="allow">允许</option>
                <option value="deny">拒绝</option>
              </select>
              <input
                placeholder="来源"
                value={newRule.source || ''}
                onChange={(e) => setNewRule({ ...newRule, source: e.target.value })}
                style={{ padding: '4px 8px', background: '#313244', border: '1px solid #45475a', borderRadius: '4px', color: '#cdd6f4', fontSize: '11px', width: '100px', outline: 'none' }}
              />
              <button
                onClick={addRule}
                style={{ padding: '4px 10px', background: '#a6e3a1', color: '#1e1e2e', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}
              >
                添加
              </button>
            </div>
          )}

          <div style={{ flex: 1, overflowY: 'auto' }}>
            <div style={{ display: 'flex', padding: '6px 12px', fontSize: '11px', fontWeight: 600, color: '#a6adc8', borderBottom: '1px solid #45475a' }}>
              <span style={{ width: '30px' }}>状态</span>
              <span style={{ flex: 1 }}>名称</span>
              <span style={{ width: '50px' }}>方向</span>
              <span style={{ width: '60px' }}>协议</span>
              <span style={{ width: '60px' }}>端口</span>
              <span style={{ width: '50px' }}>动作</span>
              <span style={{ width: '120px' }}>来源</span>
              <span style={{ width: '60px' }}>优先级</span>
              <span style={{ width: '40px' }}>操作</span>
            </div>
            {filtered.map((rule, idx) => (
              <div
                key={rule.id}
                style={{
                  display: 'flex', alignItems: 'center', padding: '7px 12px', fontSize: '12px',
                  borderBottom: '1px solid #313244', opacity: rule.enabled ? 1 : 0.4,
                }}
              >
                <span
                  onClick={() => toggleRule(rule.id)}
                  style={{ width: '30px', cursor: 'pointer', color: rule.enabled ? '#a6e3a1' : '#f38ba8' }}
                >
                  {rule.enabled ? '●' : '○'}
                </span>
                <span style={{ flex: 1, fontWeight: 500 }}>{rule.name}</span>
                <span style={{ width: '50px', color: rule.direction === 'inbound' ? '#89b4fa' : '#f9e2af' }}>
                  {rule.direction === 'inbound' ? '入站' : '出站'}
                </span>
                <span style={{ width: '60px' }}>{rule.protocol}</span>
                <span style={{ width: '60px', color: '#89b4fa' }}>{rule.port}</span>
                <span style={{
                  width: '50px', fontWeight: 600,
                  color: rule.action === 'allow' ? '#a6e3a1' : '#f38ba8',
                }}>
                  {rule.action === 'allow' ? '允许' : '拒绝'}
                </span>
                <span style={{ width: '120px', color: '#a6adc8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {rule.source}
                </span>
                <span style={{ width: '60px', display: 'flex', gap: '2px' }}>
                  <button
                    onClick={() => moveRule(rule.id, 'up')}
                    disabled={idx === 0}
                    style={{
                      padding: '1px 4px', background: '#45475a', color: idx === 0 ? '#6c7086' : '#cdd6f4',
                      border: 'none', borderRadius: '2px', cursor: idx === 0 ? 'default' : 'pointer', fontSize: '10px',
                    }}
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => moveRule(rule.id, 'down')}
                    disabled={idx === filtered.length - 1}
                    style={{
                      padding: '1px 4px', background: '#45475a', color: idx === filtered.length - 1 ? '#6c7086' : '#cdd6f4',
                      border: 'none', borderRadius: '2px', cursor: idx === filtered.length - 1 ? 'default' : 'pointer', fontSize: '10px',
                    }}
                  >
                    ▼
                  </button>
                </span>
                <button
                  onClick={() => deleteRule(rule.id)}
                  style={{
                    width: '40px', padding: '2px 6px', background: '#f38ba8', color: '#1e1e2e',
                    border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '10px',
                  }}
                >
                  删除
                </button>
              </div>
            ))}
          </div>

          <div style={{ padding: '6px 12px', borderTop: '1px solid #313244', fontSize: '11px', color: '#6c7086' }}>
            共 {rules.length} 条规则，{rules.filter((r) => r.enabled).length} 条已启用
          </div>
        </>
      )}

      {mainTab === 'connections' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>活跃连接</span>
            <span style={{ fontSize: '11px', color: '#a6adc8' }}>{connections.length} 个连接 · 每3秒刷新</span>
          </div>
          <div style={{ display: 'flex', padding: '6px 8px', fontSize: '10px', fontWeight: 600, color: '#a6adc8', background: '#181825', borderRadius: '6px 6px 0 0' }}>
            <span style={{ flex: 1 }}>源 IP</span>
            <span style={{ flex: 1 }}>目标 IP</span>
            <span style={{ width: '60px' }}>端口</span>
            <span style={{ width: '50px' }}>协议</span>
            <span style={{ width: '90px' }}>状态</span>
            <span style={{ width: '80px' }}>流量</span>
          </div>
          {connections.map((c) => (
            <div key={c.id} style={{ display: 'flex', padding: '6px 8px', fontSize: '11px', borderBottom: '1px solid #313244', alignItems: 'center' }}>
              <span style={{ flex: 1, color: '#cdd6f4' }}>{c.srcIp}</span>
              <span style={{ flex: 1, color: '#89b4fa' }}>{c.dstIp}</span>
              <span style={{ width: '60px', color: '#f9e2af' }}>{c.port}</span>
              <span style={{ width: '50px' }}>{c.protocol}</span>
              <span style={{
                width: '90px', fontSize: '10px', padding: '2px 6px', borderRadius: '3px', textAlign: 'center',
                background: c.status === 'ESTABLISHED' ? '#a6e3a120' : c.status === 'SYN_SENT' ? '#f9e2af20' : '#6c708620',
                color: c.status === 'ESTABLISHED' ? '#a6e3a1' : c.status === 'SYN_SENT' ? '#f9e2af' : '#6c7086',
              }}>
                {c.status}
              </span>
              <span style={{ width: '80px', color: '#a6adc8' }}>{c.traffic}</span>
            </div>
          ))}
          {connections.length === 0 && (
            <div style={{ padding: '20px', textAlign: 'center', color: '#6c7086', fontSize: '12px' }}>
              {firewallOn ? '等待连接数据...' : '防火墙已关闭'}
            </div>
          )}
        </div>
      )}

      {mainTab === 'logs' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>阻止日志</span>
            <button
              onClick={() => setBlockedLogs([])}
              style={{ padding: '3px 8px', background: '#45475a', color: '#cdd6f4', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '10px' }}
            >
              清空
            </button>
          </div>
          <div style={{ display: 'flex', padding: '6px 8px', fontSize: '10px', fontWeight: 600, color: '#a6adc8', background: '#181825', borderRadius: '6px 6px 0 0' }}>
            <span style={{ width: '70px' }}>时间</span>
            <span style={{ flex: 1 }}>源 IP</span>
            <span style={{ flex: 1 }}>目标 IP</span>
            <span style={{ width: '60px' }}>端口</span>
            <span style={{ width: '50px' }}>协议</span>
            <span style={{ width: '100px' }}>匹配规则</span>
          </div>
          {blockedLogs.map((log) => (
            <div key={log.id} style={{ display: 'flex', padding: '6px 8px', fontSize: '11px', borderBottom: '1px solid #313244', alignItems: 'center' }}>
              <span style={{ width: '70px', color: '#f38ba8' }}>{log.timestamp}</span>
              <span style={{ flex: 1, color: '#cdd6f4' }}>{log.srcIp}</span>
              <span style={{ flex: 1, color: '#89b4fa' }}>{log.dstIp}</span>
              <span style={{ width: '60px', color: '#f9e2af' }}>{log.port}</span>
              <span style={{ width: '50px' }}>{log.protocol}</span>
              <span style={{ width: '100px', color: '#f38ba8', fontSize: '10px' }}>{log.rule}</span>
            </div>
          ))}
          {blockedLogs.length === 0 && (
            <div style={{ padding: '20px', textAlign: 'center', color: '#6c7086', fontSize: '12px' }}>暂无阻止记录</div>
          )}
        </div>
      )}

      {mainTab === 'traffic' && (
        <div style={{ flex: 1, padding: '12px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>流量统计</div>
          <canvas
            ref={canvasRef}
            style={{ width: '100%', height: '250px', background: '#181825', borderRadius: '8px' }}
          />
          <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {Object.entries(trafficData).sort(([a], [b]) => Number(a) - Number(b)).map(([port, val]) => (
              <div key={port} style={{ padding: '6px 10px', background: '#313244', borderRadius: '6px', fontSize: '11px' }}>
                <span style={{ color: '#89b4fa' }}>:{port}</span>
                <span style={{ color: '#cdd6f4', marginLeft: '6px' }}>{Math.round(val)} KB/s</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {mainTab === 'scans' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>端口扫描检测</span>
            <span style={{ fontSize: '11px', color: portScans.some((s) => s.status === 'active') ? '#f38ba8' : '#a6e3a1' }}>
              {portScans.some((s) => s.status === 'active') ? '⚠ 检测到活跃扫描' : '✓ 无活跃扫描'}
            </span>
          </div>
          {portScans.map((scan) => (
            <div key={scan.id} style={{ padding: '10px 12px', background: '#313244', borderRadius: '8px', marginBottom: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#f38ba8' }}>来源: {scan.srcIp}</span>
                <span style={{
                  fontSize: '10px', padding: '2px 8px', borderRadius: '10px',
                  background: scan.status === 'active' ? '#f38ba830' : '#a6e3a130',
                  color: scan.status === 'active' ? '#f38ba8' : '#a6e3a1',
                }}>
                  {scan.status === 'active' ? '活跃' : '已停止'}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#a6adc8', marginBottom: '4px' }}>开始时间: {scan.startTime} · 扫描端口数: {scan.ports.length}</div>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {scan.ports.map((p) => (
                  <span key={p} style={{ padding: '2px 6px', background: '#45475a', borderRadius: '3px', fontSize: '10px', color: '#f9e2af' }}>
                    :{p}
                  </span>
                ))}
              </div>
            </div>
          ))}
          {portScans.length === 0 && (
            <div style={{ padding: '20px', textAlign: 'center', color: '#6c7086', fontSize: '12px' }}>暂无扫描检测记录</div>
          )}
        </div>
      )}
    </div>
  )
}
