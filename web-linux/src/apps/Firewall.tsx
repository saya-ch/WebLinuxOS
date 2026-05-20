import { useState, useEffect, useRef } from 'react'
import type { CSSProperties, ChangeEvent } from 'react'

interface FirewallRule {
  id: string
  name: string
  direction: 'inbound' | 'outbound'
  protocol: 'TCP' | 'UDP' | 'ICMP' | 'ANY'
  port: string
  action: 'allow' | 'deny'
  enabled: boolean
}

interface Connection {
  id: string
  srcIp: string
  srcPort: number
  destIp: string
  destPort: number
  protocol: string
  status: string
  traffic: string
}

interface LogEntry {
  id: string
  timestamp: string
  srcIp: string
  destPort: number
  protocol: string
  action: string
  ruleName: string
}

interface ScanDetection {
  id: string
  srcIp: string
  scannedPorts: number[]
  startTime: string
  status: 'active' | 'stopped'
}

interface PortTraffic {
  port: number
  inbound: number
  outbound: number
}

const initialRules: FirewallRule[] = [
  { id: 'r1', name: '允许HTTP出站', direction: 'outbound', protocol: 'TCP', port: '80', action: 'allow', enabled: true },
  { id: 'r2', name: '允许HTTPS出站', direction: 'outbound', protocol: 'TCP', port: '443', action: 'allow', enabled: true },
  { id: 'r3', name: '允许SSH入站', direction: 'inbound', protocol: 'TCP', port: '22', action: 'allow', enabled: true },
  { id: 'r4', name: '拒绝ICMP', direction: 'inbound', protocol: 'ICMP', port: '-', action: 'deny', enabled: true },
  { id: 'r5', name: '拒绝所有其他入站', direction: 'inbound', protocol: 'ANY', port: '-', action: 'deny', enabled: true },
]

const randomIp = () =>
  `${Math.floor(Math.random() * 223) + 1}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`

const portPool = [22, 53, 80, 110, 143, 443, 993, 995, 3306, 3389, 5432, 5900, 8080, 8443]
const randomPort = () => portPool[Math.floor(Math.random() * portPool.length)]
const protoList = ['TCP', 'UDP', 'ICMP']
const statusList = ['ESTABLISHED', 'TIME_WAIT', 'CLOSE_WAIT', 'SYN_SENT', 'LISTEN']

const makeConnections = (): Connection[] => {
  const n = Math.floor(Math.random() * 8) + 5
  return Array.from({ length: n }, (_, i) => ({
    id: `c-${Date.now()}-${i}`,
    srcIp: randomIp(),
    srcPort: Math.floor(Math.random() * 60000) + 1024,
    destIp: randomIp(),
    destPort: randomPort(),
    protocol: protoList[Math.floor(Math.random() * protoList.length)],
    status: statusList[Math.floor(Math.random() * statusList.length)],
    traffic: `${(Math.random() * 100).toFixed(1)} KB`,
  }))
}

const makeLog = (rules: FirewallRule[]): LogEntry => {
  const denyRules = rules.filter(r => r.action === 'deny' && r.enabled)
  const rule = denyRules.length > 0 ? denyRules[Math.floor(Math.random() * denyRules.length)] : rules[0]
  return {
    id: `l-${Date.now()}-${Math.random()}`,
    timestamp: new Date().toLocaleString('zh-CN'),
    srcIp: randomIp(),
    destPort: randomPort(),
    protocol: protoList[Math.floor(Math.random() * protoList.length)],
    action: 'deny',
    ruleName: rule ? rule.name : '未知规则',
  }
}

const makeTraffic = (): PortTraffic[] =>
  [22, 53, 80, 443, 3306, 5432, 8080, 8443].map(port => ({
    port,
    inbound: Math.floor(Math.random() * 900) + 100,
    outbound: Math.floor(Math.random() * 600) + 50,
  }))

const makeScans = (): ScanDetection[] => {
  const n = Math.floor(Math.random() * 3) + 2
  return Array.from({ length: n }, (_, i) => ({
    id: `s-${Date.now()}-${i}`,
    srcIp: randomIp(),
    scannedPorts: Array.from({ length: Math.floor(Math.random() * 8) + 3 }, () => randomPort()).filter(
      (v, idx, arr) => arr.indexOf(v) === idx
    ),
    startTime: new Date(Date.now() - Math.floor(Math.random() * 3600000)).toLocaleString('zh-CN'),
    status: Math.random() > 0.4 ? ('active' as const) : ('stopped' as const),
  }))
}

type TabKey = 'rules' | 'connections' | 'logs' | 'traffic' | 'scan'

const tabItems: { key: TabKey; label: string }[] = [
  { key: 'rules', label: '规则' },
  { key: 'connections', label: '连接' },
  { key: 'logs', label: '日志' },
  { key: 'traffic', label: '流量' },
  { key: 'scan', label: '扫描' },
]

const inputBase: CSSProperties = {
  padding: '4px 8px',
  background: '#313244',
  border: '1px solid #45475a',
  borderRadius: '4px',
  color: '#cdd6f4',
  fontSize: '11px',
  outline: 'none',
}

const btn = (bg: string, fg: string): CSSProperties => ({
  padding: '4px 10px',
  background: bg,
  color: fg,
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '11px',
})

export default function Firewall() {
  const [tab, setTab] = useState<TabKey>('rules')
  const [rules, setRules] = useState<FirewallRule[]>(initialRules)
  const [connections, setConnections] = useState<Connection[]>([])
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [trafficData, setTrafficData] = useState<PortTraffic[]>(makeTraffic())
  const [scans, setScans] = useState<ScanDetection[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<FirewallRule>>({})
  const [newRule, setNewRule] = useState<Partial<FirewallRule>>({
    direction: 'inbound',
    protocol: 'TCP',
    action: 'allow',
    port: '',
    name: '',
  })
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (tab !== 'connections') return
    setConnections(makeConnections())
    const iv = setInterval(() => setConnections(makeConnections()), 3000)
    return () => clearInterval(iv)
  }, [tab])

  useEffect(() => {
    if (tab !== 'logs') return
    const add = () => setLogs(prev => [makeLog(rules), ...prev].slice(0, 100))
    add()
    const iv = setInterval(add, 2000)
    return () => clearInterval(iv)
  }, [tab, rules])

  useEffect(() => {
    if (tab !== 'traffic') return
    setTrafficData(makeTraffic())
    const iv = setInterval(() => setTrafficData(makeTraffic()), 3000)
    return () => clearInterval(iv)
  }, [tab])

  useEffect(() => {
    if (tab !== 'scan') return
    setScans(makeScans())
    const iv = setInterval(() => setScans(makeScans()), 5000)
    return () => clearInterval(iv)
  }, [tab])

  useEffect(() => {
    if (tab !== 'traffic' || !canvasRef.current) return
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
    ctx.fillStyle = '#181825'
    ctx.fillRect(0, 0, w, h)
    const pad = { top: 30, right: 20, bottom: 40, left: 50 }
    const cw = w - pad.left - pad.right
    const ch = h - pad.top - pad.bottom
    const maxVal = Math.max(...trafficData.flatMap(d => [d.inbound, d.outbound]), 100)
    const groupW = cw / trafficData.length
    const barW = groupW * 0.3
    const gap = groupW * 0.1
    ctx.strokeStyle = '#313244'
    ctx.lineWidth = 0.5
    for (let i = 0; i <= 5; i++) {
      const y = pad.top + (ch / 5) * i
      ctx.beginPath()
      ctx.moveTo(pad.left, y)
      ctx.lineTo(w - pad.right, y)
      ctx.stroke()
      ctx.fillStyle = '#6c7086'
      ctx.font = '10px sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText(Math.round(maxVal - (maxVal / 5) * i).toString(), pad.left - 8, y + 4)
    }
    trafficData.forEach((d, i) => {
      const x = pad.left + groupW * i + groupW * 0.15
      const inH = (d.inbound / maxVal) * ch
      const outH = (d.outbound / maxVal) * ch
      ctx.fillStyle = '#89b4fa'
      ctx.fillRect(x, pad.top + ch - inH, barW, inH)
      ctx.fillStyle = '#a6e3a1'
      ctx.fillRect(x + barW + gap, pad.top + ch - outH, barW, outH)
      ctx.fillStyle = '#a6adc8'
      ctx.font = '10px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(d.port.toString(), x + barW + gap / 2, pad.top + ch + 16)
    })
    ctx.fillStyle = '#89b4fa'
    ctx.fillRect(pad.left, 8, 12, 10)
    ctx.fillStyle = '#cdd6f4'
    ctx.font = '10px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('入站', pad.left + 16, 17)
    ctx.fillStyle = '#a6e3a1'
    ctx.fillRect(pad.left + 60, 8, 12, 10)
    ctx.fillStyle = '#cdd6f4'
    ctx.fillText('出站', pad.left + 76, 17)
  }, [tab, trafficData])

  const toggleRule = (id: string) =>
    setRules(prev => prev.map(r => (r.id === id ? { ...r, enabled: !r.enabled } : r)))

  const deleteRule = (id: string) =>
    setRules(prev => prev.filter(r => r.id !== id))

  const addRule = () => {
    if (!newRule.name || !newRule.port) return
    setRules(prev => [
      ...prev,
      {
        id: `rule-${Date.now()}`,
        name: newRule.name || '',
        direction: (newRule.direction as 'inbound' | 'outbound') || 'inbound',
        protocol: (newRule.protocol as FirewallRule['protocol']) || 'TCP',
        port: newRule.port || '-',
        action: (newRule.action as 'allow' | 'deny') || 'allow',
        enabled: true,
      },
    ])
    setNewRule({ direction: 'inbound', protocol: 'TCP', action: 'allow', port: '', name: '' })
    setShowAdd(false)
  }

  const startEdit = (rule: FirewallRule) => {
    setEditId(rule.id)
    setEditForm({ ...rule })
  }

  const saveEdit = () => {
    if (!editId || !editForm.name) return
    setRules(prev =>
      prev.map(r =>
        r.id === editId
          ? {
              ...r,
              name: editForm.name || r.name,
              direction: (editForm.direction as 'inbound' | 'outbound') || r.direction,
              protocol: (editForm.protocol as FirewallRule['protocol']) || r.protocol,
              port: editForm.port || r.port,
              action: (editForm.action as 'allow' | 'deny') || r.action,
            }
          : r
      )
    )
    setEditId(null)
    setEditForm({})
  }

  const moveRule = (id: string, dir: 'up' | 'down') => {
    setRules(prev => {
      const idx = prev.findIndex(r => r.id === id)
      if (idx < 0) return prev
      if (dir === 'up' && idx === 0) return prev
      if (dir === 'down' && idx === prev.length - 1) return prev
      const next = [...prev]
      const swap = dir === 'up' ? idx - 1 : idx + 1
      ;[next[idx], next[swap]] = [next[swap], next[idx]]
      return next
    })
  }

  const exportRules = () => {
    const blob = new Blob([JSON.stringify(rules, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'firewall-rules.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const importRules = () => {
    fileRef.current?.click()
  }

  const handleImport = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target?.result as string)
        if (Array.isArray(data)) {
          setRules(data as FirewallRule[])
        }
      } catch {
        // invalid json
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const renderForm = (
    form: Partial<FirewallRule>,
    setForm: (f: Partial<FirewallRule>) => void,
    onSave: () => void,
    onCancel: () => void
  ) => (
    <div
      style={{
        padding: '10px 12px',
        borderBottom: '1px solid #313244',
        background: '#181825',
        display: 'flex',
        gap: '6px',
        flexWrap: 'wrap',
        alignItems: 'center',
      }}
    >
      <input
        placeholder="规则名称"
        value={form.name || ''}
        onChange={e => setForm({ ...form, name: e.target.value })}
        style={{ ...inputBase, width: '120px' }}
      />
      <select
        value={form.direction}
        onChange={e => setForm({ ...form, direction: e.target.value as 'inbound' | 'outbound' })}
        style={inputBase}
      >
        <option value="inbound">入站</option>
        <option value="outbound">出站</option>
      </select>
      <select
        value={form.protocol}
        onChange={e => setForm({ ...form, protocol: e.target.value as FirewallRule['protocol'] })}
        style={inputBase}
      >
        <option value="TCP">TCP</option>
        <option value="UDP">UDP</option>
        <option value="ICMP">ICMP</option>
        <option value="ANY">ANY</option>
      </select>
      <input
        placeholder="端口"
        value={form.port || ''}
        onChange={e => setForm({ ...form, port: e.target.value })}
        style={{ ...inputBase, width: '70px' }}
      />
      <select
        value={form.action}
        onChange={e => setForm({ ...form, action: e.target.value as 'allow' | 'deny' })}
        style={inputBase}
      >
        <option value="allow">允许</option>
        <option value="deny">拒绝</option>
      </select>
      <button onClick={onSave} style={btn('#a6e3a1', '#1e1e2e')}>
        保存
      </button>
      <button onClick={onCancel} style={btn('#45475a', '#cdd6f4')}>
        取消
      </button>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1e1e2e', color: '#cdd6f4' }}>
      <div style={{ display: 'flex', borderBottom: '1px solid #313244', padding: '0 12px' }}>
        {tabItems.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderBottom: tab === t.key ? '2px solid #89b4fa' : '2px solid transparent',
              background: 'transparent',
              color: tab === t.key ? '#89b4fa' : '#a6adc8',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: tab === t.key ? 600 : 400,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        {tab === 'rules' && (
          <div>
            <div
              style={{
                padding: '8px 12px',
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
                borderBottom: '1px solid #313244',
              }}
            >
              <button onClick={() => setShowAdd(!showAdd)} style={btn('#a6e3a1', '#1e1e2e')}>
                + 添加规则
              </button>
              <button onClick={exportRules} style={btn('#89b4fa', '#1e1e2e')}>
                导出规则
              </button>
              <button onClick={importRules} style={btn('#f9e2af', '#1e1e2e')}>
                导入规则
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                style={{ display: 'none' }}
              />
            </div>

            {showAdd &&
              renderForm(
                newRule,
                f => setNewRule(f),
                addRule,
                () => {
                  setShowAdd(false)
                  setNewRule({ direction: 'inbound', protocol: 'TCP', action: 'allow', port: '', name: '' })
                }
              )}

            {editId &&
              renderForm(
                editForm,
                f => setEditForm(f),
                saveEdit,
                () => {
                  setEditId(null)
                  setEditForm({})
                }
              )}

            <div
              style={{
                display: 'flex',
                padding: '6px 12px',
                fontSize: '11px',
                fontWeight: 600,
                color: '#a6adc8',
                borderBottom: '1px solid #45475a',
              }}
            >
              <span style={{ width: '30px' }}>状态</span>
              <span style={{ flex: 1 }}>名称</span>
              <span style={{ width: '50px' }}>方向</span>
              <span style={{ width: '60px' }}>协议</span>
              <span style={{ width: '60px' }}>端口</span>
              <span style={{ width: '50px' }}>动作</span>
              <span style={{ width: '110px' }}>操作</span>
            </div>

            {rules.map((rule, idx) => (
              <div
                key={rule.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '7px 12px',
                  fontSize: '12px',
                  borderBottom: '1px solid #313244',
                  opacity: rule.enabled ? 1 : 0.4,
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
                <span
                  style={{
                    width: '50px',
                    fontWeight: 600,
                    color: rule.action === 'allow' ? '#a6e3a1' : '#f38ba8',
                  }}
                >
                  {rule.action === 'allow' ? '允许' : '拒绝'}
                </span>
                <span style={{ width: '110px', display: 'flex', gap: '3px' }}>
                  <button
                    onClick={() => moveRule(rule.id, 'up')}
                    disabled={idx === 0}
                    style={{
                      ...btn('#313244', '#cdd6f4'),
                      padding: '2px 6px',
                      opacity: idx === 0 ? 0.3 : 1,
                    }}
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveRule(rule.id, 'down')}
                    disabled={idx === rules.length - 1}
                    style={{
                      ...btn('#313244', '#cdd6f4'),
                      padding: '2px 6px',
                      opacity: idx === rules.length - 1 ? 0.3 : 1,
                    }}
                  >
                    ↓
                  </button>
                  <button onClick={() => startEdit(rule)} style={{ ...btn('#89b4fa', '#1e1e2e'), padding: '2px 6px' }}>
                    编辑
                  </button>
                  <button onClick={() => deleteRule(rule.id)} style={{ ...btn('#f38ba8', '#1e1e2e'), padding: '2px 6px' }}>
                    删除
                  </button>
                </span>
              </div>
            ))}

            <div style={{ padding: '6px 12px', fontSize: '11px', color: '#6c7086' }}>
              共 {rules.length} 条规则，{rules.filter(r => r.enabled).length} 条已启用
            </div>
          </div>
        )}

        {tab === 'connections' && (
          <div>
            <div style={{ padding: '8px 12px', fontSize: '12px', color: '#a6adc8', borderBottom: '1px solid #313244' }}>
              实时连接监控（每3秒刷新）
            </div>
            <div
              style={{
                display: 'flex',
                padding: '6px 12px',
                fontSize: '11px',
                fontWeight: 600,
                color: '#a6adc8',
                borderBottom: '1px solid #45475a',
              }}
            >
              <span style={{ flex: 1 }}>源地址</span>
              <span style={{ width: '60px' }}>源端口</span>
              <span style={{ flex: 1 }}>目标地址</span>
              <span style={{ width: '60px' }}>目标端口</span>
              <span style={{ width: '50px' }}>协议</span>
              <span style={{ width: '90px' }}>状态</span>
              <span style={{ width: '70px' }}>流量</span>
            </div>
            {connections.map(c => (
              <div
                key={c.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '6px 12px',
                  fontSize: '11px',
                  borderBottom: '1px solid #313244',
                }}
              >
                <span style={{ flex: 1, color: '#89b4fa' }}>{c.srcIp}</span>
                <span style={{ width: '60px' }}>{c.srcPort}</span>
                <span style={{ flex: 1, color: '#f9e2af' }}>{c.destIp}</span>
                <span style={{ width: '60px', color: '#89b4fa' }}>{c.destPort}</span>
                <span style={{ width: '50px' }}>{c.protocol}</span>
                <span
                  style={{
                    width: '90px',
                    color:
                      c.status === 'ESTABLISHED'
                        ? '#a6e3a1'
                        : c.status === 'LISTEN'
                          ? '#89b4fa'
                          : '#f9e2af',
                  }}
                >
                  {c.status}
                </span>
                <span style={{ width: '70px', color: '#a6adc8' }}>{c.traffic}</span>
              </div>
            ))}
          </div>
        )}

        {tab === 'logs' && (
          <div>
            <div style={{ padding: '8px 12px', fontSize: '12px', color: '#a6adc8', borderBottom: '1px solid #313244' }}>
              被阻止的连接尝试日志
            </div>
            <div
              style={{
                display: 'flex',
                padding: '6px 12px',
                fontSize: '11px',
                fontWeight: 600,
                color: '#a6adc8',
                borderBottom: '1px solid #45475a',
              }}
            >
              <span style={{ width: '150px' }}>时间</span>
              <span style={{ flex: 1 }}>源IP</span>
              <span style={{ width: '70px' }}>目标端口</span>
              <span style={{ width: '50px' }}>协议</span>
              <span style={{ width: '50px' }}>动作</span>
              <span style={{ flex: 1 }}>匹配规则</span>
            </div>
            {logs.map(l => (
              <div
                key={l.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '6px 12px',
                  fontSize: '11px',
                  borderBottom: '1px solid #313244',
                }}
              >
                <span style={{ width: '150px', color: '#6c7086' }}>{l.timestamp}</span>
                <span style={{ flex: 1, color: '#f38ba8' }}>{l.srcIp}</span>
                <span style={{ width: '70px', color: '#89b4fa' }}>{l.destPort}</span>
                <span style={{ width: '50px' }}>{l.protocol}</span>
                <span style={{ width: '50px', color: '#f38ba8', fontWeight: 600 }}>拒绝</span>
                <span style={{ flex: 1, color: '#f9e2af' }}>{l.ruleName}</span>
              </div>
            ))}
          </div>
        )}

        {tab === 'traffic' && (
          <div style={{ padding: '12px' }}>
            <div style={{ fontSize: '12px', color: '#a6adc8', marginBottom: '8px' }}>各端口流量统计</div>
            <canvas ref={canvasRef} style={{ width: '100%', height: '260px', borderRadius: '6px' }} />
          </div>
        )}

        {tab === 'scan' && (
          <div>
            <div style={{ padding: '8px 12px', fontSize: '12px', color: '#a6adc8', borderBottom: '1px solid #313244' }}>
              端口扫描检测
            </div>
            {scans.map(s => (
              <div
                key={s.id}
                style={{ margin: '8px 12px', padding: '10px', background: '#313244', borderRadius: '6px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: s.status === 'active' ? '#f38ba8' : '#6c7086',
                    }}
                  />
                  <span style={{ fontWeight: 600, color: '#f38ba8' }}>{s.srcIp}</span>
                  <span style={{ fontSize: '11px', color: '#6c7086' }}>{s.startTime}</span>
                  <span
                    style={{
                      fontSize: '10px',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      background: s.status === 'active' ? '#f38ba833' : '#6c708633',
                      color: s.status === 'active' ? '#f38ba8' : '#6c7086',
                    }}
                  >
                    {s.status === 'active' ? '进行中' : '已停止'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {s.scannedPorts.map((p, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        background: '#45475a',
                        borderRadius: '3px',
                        color: '#cdd6f4',
                      }}
                    >
                      :{p}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
