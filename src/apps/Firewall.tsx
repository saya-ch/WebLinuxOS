import { useState } from 'react'

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

export default function Firewall() {
  const [rules, setRules] = useState<FirewallRule[]>(presetRules)
  const [firewallOn, setFirewallOn] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newRule, setNewRule] = useState<Partial<FirewallRule>>({
    direction: 'inbound', protocol: 'TCP', action: 'allow', source: 'any',
  })
  const [tab, setTab] = useState<'all' | 'inbound' | 'outbound'>('all')

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

  const filtered = rules.filter((r) => {
    if (tab === 'inbound' && r.direction !== 'inbound') return false
    if (tab === 'outbound' && r.direction !== 'outbound') return false
    return true
  })

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

        {['all', 'inbound', 'outbound'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t as typeof tab)}
            style={{
              padding: '4px 10px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px',
              background: tab === t ? '#89b4fa' : '#313244',
              color: tab === t ? '#1e1e2e' : '#cdd6f4',
            }}
          >
            {t === 'all' ? '全部' : t === 'inbound' ? '入站' : '出站'}
          </button>
        ))}

        <button
          onClick={() => setShowAdd(!showAdd)}
          style={{
            padding: '4px 10px', background: '#a6e3a1', color: '#1e1e2e',
            border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px',
          }}
        >
          + 添加规则
        </button>
      </div>

      <div style={{ padding: '8px 12px', borderBottom: '1px solid #313244', display: 'flex', gap: '6px' }}>
        <span style={{ fontSize: '11px', color: '#a6adc8' }}>预设模板:</span>
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
          <span style={{ width: '40px' }}>操作</span>
        </div>
        {filtered.map((rule) => (
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
    </div>
  )
}