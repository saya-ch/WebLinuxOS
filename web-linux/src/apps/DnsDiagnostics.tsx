import { useState, useEffect, useCallback } from 'react'
import { useStore } from '../store'

interface DnsResult {
  type: string
  data: string[]
  time?: number
}

interface PortResult {
  port: number
  status: 'open' | 'closed' | 'timeout'
  service: string
  responseTime?: number
}

interface HttpResult {
  url: string
  status?: number
  statusText?: string
  responseTime?: number
  headers?: Record<string, string>
  error?: string
}

const DNS_TYPES = ['A', 'AAAA', 'MX', 'NS', 'TXT', 'CNAME', 'SOA', 'PTR', 'SRV', 'CAA']
const COMMON_PORTS = [
  { port: 21, service: 'FTP' },
  { port: 22, service: 'SSH' },
  { port: 23, service: 'Telnet' },
  { port: 25, service: 'SMTP' },
  { port: 53, service: 'DNS' },
  { port: 80, service: 'HTTP' },
  { port: 110, service: 'POP3' },
  { port: 143, service: 'IMAP' },
  { port: 443, service: 'HTTPS' },
  { port: 3306, service: 'MySQL' },
  { port: 3389, service: 'RDP' },
  { port: 5432, service: 'PostgreSQL' },
  { port: 6379, service: 'Redis' },
  { port: 8080, service: 'HTTP-Alt' },
  { port: 8443, service: 'HTTPS-Alt' },
]

const CloudflareDoH = 'https://cloudflare-dns.com/dns-query'

type TabType = 'dns' | 'port' | 'http' | 'asn'

export default function DnsDiagnostics() {
  const [tab, setTab] = useState<TabType>('dns')
  const [domain, setDomain] = useState('')
  const [dnsType, setDnsType] = useState('A')
  const [dnsResults, setDnsResults] = useState<DnsResult[]>([])
  const [dnsLoading, setDnsLoading] = useState(false)

  const [portResults, setPortResults] = useState<PortResult[]>([])
  const [portLoading, setPortLoading] = useState(false)
  const [customPort, setCustomPort] = useState('')
  const [selectedPorts, setSelectedPorts] = useState<number[]>(COMMON_PORTS.map(p => p.port))

  const [httpUrl, setHttpUrl] = useState('')
  const [httpResult, setHttpResult] = useState<HttpResult | null>(null)
  const [httpLoading, setHttpLoading] = useState(false)

  const [asnInput, setAsnInput] = useState('')
  const [asnData, setAsnData] = useState<any>(null)
  const [asnLoading, setAsnLoading] = useState(false)

  const [history, setHistory] = useState<string[]>([])

  const addNotification = useStore((s) => s.addNotification)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('weblinux-dns-history')
      if (raw) setHistory(JSON.parse(raw))
    } catch { /* ignore */ }
  }, [])

  const saveHistoryEntry = useCallback((entry: string) => {
    setHistory((prev) => {
      const next = [entry, ...prev.filter(h => h !== entry)].slice(0, 15)
      try {
        localStorage.setItem('weblinux-dns-history', JSON.stringify(next))
      } catch { /* ignore */ }
      return next
    })
  }, [])

  const resolveDns = useCallback(async () => {
    if (!domain.trim()) {
      addNotification({ title: 'DNS 诊断', message: '请输入域名', type: 'warning' })
      return
    }
    setDnsLoading(true)
    setDnsResults([])
    const startTime = Date.now()

    try {
      const url = `${CloudflareDoH}?name=${encodeURIComponent(domain.trim())}&type=${dnsType}`
      const res = await fetch(url, {
        headers: { 'Accept': 'application/dns-json' }
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()

      const results: string[] = []
      if (data.Answer) {
        for (const record of data.Answer) {
          let value = record.data
          if (record.type === 5) value = `CNAME → ${record.data}`
          if (record.type === 15) {
            const parts = record.data.split(' ')
            value = `MX ${parts[0]} → ${parts[1]}`
          }
          results.push(value)
        }
      }

      setDnsResults([{
        type: dnsType,
        data: results,
        time: Date.now() - startTime
      }])
      saveHistoryEntry(domain.trim())
      addNotification({ title: 'DNS 诊断', message: `查询完成，找到 ${results.length} 条记录`, type: 'success' })
    } catch (err: any) {
      addNotification({ title: 'DNS 诊断', message: `查询失败: ${err.message}`, type: 'error' })
      setDnsResults([{ type: dnsType, data: [], time: Date.now() - startTime }])
    } finally {
      setDnsLoading(false)
    }
  }, [domain, dnsType, addNotification, saveHistoryEntry])

  const scanPort = useCallback(async (host: string, port: number): Promise<PortResult> => {
    const startTime = Date.now()
    const service = COMMON_PORTS.find(p => p.port === port)?.service || 'Unknown'

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000)

      await fetch(`https://${host}:${port}`, {
        mode: 'no-cors',
        signal: controller.signal,
        cache: 'no-store',
      })

      clearTimeout(timeoutId)
      return {
        port,
        status: 'open',
        service,
        responseTime: Date.now() - startTime,
      }
    } catch {
      return {
        port,
        status: 'timeout',
        service,
        responseTime: Date.now() - startTime,
      }
    }
  }, [])

  const scanPorts = useCallback(async () => {
    if (!domain.trim()) {
      addNotification({ title: '端口扫描', message: '请输入域名或 IP', type: 'warning' })
      return
    }
    setPortLoading(true)
    setPortResults([])

    const portsToScan = selectedPorts.length > 0 ? selectedPorts : COMMON_PORTS.map(p => p.port)
    const results: PortResult[] = []

    for (const port of portsToScan) {
      const result = await scanPort(domain.trim(), port)
      results.push(result)
      setPortResults([...results])
    }

    saveHistoryEntry(domain.trim())
    setPortLoading(false)
    const openCount = results.filter(r => r.status === 'open').length
    addNotification({ title: '端口扫描', message: `扫描完成，发现 ${openCount} 个开放端口`, type: 'success' })
  }, [domain, selectedPorts, scanPort, addNotification, saveHistoryEntry])

  const checkHttp = useCallback(async () => {
    let url = httpUrl.trim()
    if (!url) {
      addNotification({ title: 'HTTP 诊断', message: '请输入 URL', type: 'warning' })
      return
    }
    if (!url.startsWith('http')) url = 'https://' + url

    setHttpLoading(true)
    setHttpResult(null)
    const startTime = Date.now()

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const res = await fetch(url, {
        method: 'GET',
        mode: 'no-cors',
        cache: 'no-store',
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      const elapsed = Date.now() - startTime

      setHttpResult({
        url,
        status: res.status,
        statusText: res.statusText,
        responseTime: elapsed,
      })
      saveHistoryEntry(url.replace(/^https?:\/\//, '').split('/')[0])
    } catch (err: any) {
      setHttpResult({
        url,
        status: 0,
        error: err.name === 'AbortError' ? '请求超时' : err.message,
        responseTime: Date.now() - startTime,
      })
      addNotification({ title: 'HTTP 诊断', message: `连接失败`, type: 'error' })
    } finally {
      setHttpLoading(false)
    }
  }, [httpUrl, addNotification, saveHistoryEntry])

  const lookupAsn = useCallback(async () => {
    if (!asnInput.trim()) {
      addNotification({ title: 'ASN 查询', message: '请输入 IP 或 ASN 号', type: 'warning' })
      return
    }
    setAsnLoading(true)
    setAsnData(null)

    try {
      const query = asnInput.trim().toUpperCase().startsWith('AS') ? asnInput.trim() : asnInput.trim()
      const res = await fetch(`https://ipapi.co/${encodeURIComponent(query)}/json/`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setAsnData(data)
      saveHistoryEntry(asnInput.trim())
    } catch (err: any) {
      addNotification({ title: 'ASN 查询', message: `查询失败: ${err.message}`, type: 'error' })
    } finally {
      setAsnLoading(false)
    }
  }, [asnInput, addNotification, saveHistoryEntry])

  const togglePort = (port: number) => {
    setSelectedPorts(prev =>
      prev.includes(port) ? prev.filter(p => p !== port) : [...prev, port].sort((a, b) => a - b)
    )
  }

  const addCustomPort = () => {
    const p = parseInt(customPort)
    if (p >= 1 && p <= 65535 && !selectedPorts.includes(p)) {
      setSelectedPorts(prev => [...prev, p].sort((a, b) => a - b))
      setCustomPort('')
    }
  }

  return (
    <div className="app-shell" style={{
      height: '100%', overflowY: 'auto', padding: 20,
      background: 'linear-gradient(135deg, #050510 0%, #0a0a1e 50%, #0d0520 100%)',
      color: '#e8e8f0', fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    }}>
      {/* Header */}
      <div style={{
        marginBottom: 20, padding: '20px 24px', borderRadius: 14,
        background: 'linear-gradient(135deg, rgba(124, 108, 240, 0.15), rgba(0, 214, 193, 0.1))',
        border: '1px solid rgba(124, 108, 240, 0.3)',
        boxShadow: '0 0 40px rgba(124, 108, 240, 0.15)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 }}>
          <div style={{
            fontSize: 28, width: 52, height: 52, borderRadius: 12,
            background: 'linear-gradient(135deg, #7c6cf0, #00d6c1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(124, 108, 240, 0.5)',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '0.5px' }}>
              DNS 网络诊断中心
            </div>
            <div style={{ fontSize: 12, color: 'rgba(232, 232, 240, 0.5)', marginTop: 2 }}>
              集成 DNS 解析 · 端口扫描 · HTTP 检测 · ASN 查询 · 数据来源: Cloudflare / ipapi.co
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap' }}>
        {([
          { key: 'dns', label: 'DNS 解析', icon: '🔍' },
          { key: 'port', label: '端口扫描', icon: '🔌' },
          { key: 'http', label: 'HTTP 检测', icon: '🌐' },
          { key: 'asn', label: 'ASN 查询', icon: '🏢' },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '10px 20px', borderRadius: 10,
              background: tab === t.key
                ? 'linear-gradient(135deg, rgba(124, 108, 240, 0.8), rgba(0, 214, 193, 0.6))'
                : 'rgba(255, 255, 255, 0.04)',
              border: tab === t.key ? '1px solid rgba(124, 108, 240, 0.6)' : '1px solid rgba(255, 255, 255, 0.08)',
              color: tab === t.key ? '#fff' : 'rgba(232, 232, 240, 0.6)',
              cursor: 'pointer', fontSize: 13, fontWeight: 600,
              transition: 'all 0.2s',
              boxShadow: tab === t.key ? '0 0 20px rgba(124, 108, 240, 0.3)' : 'none',
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Tab: DNS */}
      {tab === 'dns' && (
        <div>
          <div style={{
            padding: 16, borderRadius: 12,
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            marginBottom: 16,
          }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
              <input
                value={domain}
                onChange={e => setDomain(e.target.value)}
                placeholder="输入域名 (example.com)"
                style={{
                  flex: 1, minWidth: 200, padding: '10px 14px', borderRadius: 8,
                  background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#fff', fontSize: 13, outline: 'none',
                }}
              />
              <select
                value={dnsType}
                onChange={e => setDnsType(e.target.value)}
                style={{
                  padding: '10px 14px', borderRadius: 8,
                  background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#fff', fontSize: 13, outline: 'none', cursor: 'pointer',
                }}
              >
                {DNS_TYPES.map(t => (
                  <option key={t} value={t} style={{ background: '#12121f' }}>{t}</option>
                ))}
              </select>
              <button
                onClick={resolveDns}
                disabled={dnsLoading}
                style={{
                  padding: '10px 24px', borderRadius: 8,
                  background: dnsLoading ? 'rgba(124, 108, 240, 0.5)' : 'linear-gradient(135deg, #7c6cf0, #5b4cd8)',
                  border: 'none', color: '#fff', cursor: dnsLoading ? 'wait' : 'pointer',
                  fontSize: 13, fontWeight: 600,
                  boxShadow: dnsLoading ? 'none' : '0 0 20px rgba(124, 108, 240, 0.4)',
                }}
              >
                {dnsLoading ? '解析中...' : '🔍 开始解析'}
              </button>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['A', 'AAAA', 'MX', 'NS', 'TXT', 'CNAME', 'CAA'].map(t => (
                <button
                  key={t}
                  onClick={() => setDnsType(t)}
                  style={{
                    padding: '4px 10px', borderRadius: 6, fontSize: 11,
                    background: dnsType === t ? 'rgba(124, 108, 240, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${dnsType === t ? 'rgba(124, 108, 240, 0.5)' : 'rgba(255, 255, 255, 0.08)'}`,
                    color: dnsType === t ? '#b8a8ff' : 'rgba(232, 232, 240, 0.6)',
                    cursor: 'pointer', fontFamily: 'monospace',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* History */}
          {history.length > 0 && tab === 'dns' && (
            <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: 'rgba(232, 232, 240, 0.4)' }}>最近查询:</span>
              {history.slice(0, 8).map(h => (
                <button key={h} onClick={() => setDomain(h)} style={{
                  padding: '3px 10px', borderRadius: 12, fontSize: 11,
                  background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'rgba(232, 232, 240, 0.6)', cursor: 'pointer', fontFamily: 'monospace',
                }}>{h}</button>
              ))}
            </div>
          )}

          {/* DNS Results */}
          {dnsResults.map((result, idx) => (
            <div key={idx} style={{
              padding: 16, borderRadius: 12, marginBottom: 12,
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>
                  <span style={{ color: '#b8a8ff' }}>{result.type}</span> 记录
                  <span style={{ color: 'rgba(232, 232, 240, 0.4)', fontSize: 11, marginLeft: 12 }}>
                    {result.data.length} 条结果 · {result.time}ms
                  </span>
                </div>
              </div>
              {result.data.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: 'rgba(232, 232, 240, 0.4)', fontSize: 13 }}>
                  未找到记录
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {result.data.map((d, i) => (
                    <div key={i} style={{
                      padding: '10px 14px', borderRadius: 8,
                      background: 'rgba(0, 0, 0, 0.25)',
                      border: '1px solid rgba(124, 108, 240, 0.15)',
                      fontFamily: 'monospace', fontSize: 13,
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                      <span>{d}</span>
                      <button onClick={() => {
                        navigator.clipboard.writeText(d)
                        addNotification({ title: '已复制', message: 'DNS 记录已复制', type: 'success' })
                      }} style={{
                        padding: '4px 10px', borderRadius: 6, fontSize: 11,
                        background: 'rgba(124, 108, 240, 0.2)', border: 'none',
                        color: '#b8a8ff', cursor: 'pointer',
                      }}>复制</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tab: Port Scanner */}
      {tab === 'port' && (
        <div>
          <div style={{
            padding: 16, borderRadius: 12, marginBottom: 16,
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
              <input
                value={domain}
                onChange={e => setDomain(e.target.value)}
                placeholder="域名或 IP"
                style={{
                  flex: 1, minWidth: 200, padding: '10px 14px', borderRadius: 8,
                  background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#fff', fontSize: 13, outline: 'none',
                }}
              />
              <input
                value={customPort}
                onChange={e => setCustomPort(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCustomPort()}
                placeholder="自定义端口 (1-65535)"
                style={{
                  width: 150, padding: '10px 14px', borderRadius: 8,
                  background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#fff', fontSize: 13, outline: 'none',
                }}
              />
              <button onClick={addCustomPort} style={{
                padding: '10px 16px', borderRadius: 8,
                background: 'rgba(0, 214, 193, 0.15)', border: '1px solid rgba(0, 214, 193, 0.4)',
                color: '#00d6c1', cursor: 'pointer', fontSize: 13,
              }}>+ 添加</button>
              <button
                onClick={scanPorts}
                disabled={portLoading}
                style={{
                  padding: '10px 24px', borderRadius: 8,
                  background: portLoading ? 'rgba(124, 108, 240, 0.5)' : 'linear-gradient(135deg, #7c6cf0, #5b4cd8)',
                  border: 'none', color: '#fff', cursor: portLoading ? 'wait' : 'pointer',
                  fontSize: 13, fontWeight: 600,
                }}
              >
                {portLoading ? `扫描中 ${portResults.length}/${selectedPorts.length}...` : '🔌 开始扫描'}
              </button>
            </div>

            {/* Port selection */}
            <div style={{ fontSize: 11, color: 'rgba(232, 232, 240, 0.4)', marginBottom: 8 }}>
              选择端口 ({selectedPorts.length} 个) · 浏览器限制: 无法真正扫描 TCP 端口，通过 HTTPS 请求近似检测
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {COMMON_PORTS.map(p => (
                <button
                  key={p.port}
                  onClick={() => togglePort(p.port)}
                  style={{
                    padding: '5px 10px', borderRadius: 6, fontSize: 11,
                    background: selectedPorts.includes(p.port) ? 'rgba(0, 214, 193, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${selectedPorts.includes(p.port) ? 'rgba(0, 214, 193, 0.5)' : 'rgba(255, 255, 255, 0.08)'}`,
                    color: selectedPorts.includes(p.port) ? '#00d6c1' : 'rgba(232, 232, 240, 0.6)',
                    cursor: 'pointer', fontFamily: 'monospace',
                  }}
                >
                  {p.port} {p.service}
                </button>
              ))}
            </div>
          </div>

          {/* Port Results */}
          {portResults.length > 0 && (
            <div style={{
              padding: 16, borderRadius: 12,
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}>
              <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 12, color: 'rgba(232, 232, 240, 0.5)' }}>
                  扫描结果:
                </span>
                <span style={{ fontSize: 12, color: '#00d6c1' }}>
                  ● 开放 {portResults.filter(r => r.status === 'open').length}
                </span>
                <span style={{ fontSize: 12, color: 'rgba(232, 232, 240, 0.5)' }}>
                  ● 超时 {portResults.filter(r => r.status !== 'open').length}
                </span>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: 8,
              }}>
                {portResults.map((r, i) => (
                  <div key={i} style={{
                    padding: '10px 12px', borderRadius: 8,
                    background: r.status === 'open' ? 'rgba(0, 214, 193, 0.08)' : 'rgba(255, 77, 95, 0.05)',
                    border: `1px solid ${r.status === 'open' ? 'rgba(0, 214, 193, 0.3)' : 'rgba(255, 77, 95, 0.2)'}`,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'monospace' }}>
                        {r.port}
                      </div>
                      <div style={{ fontSize: 10, color: 'rgba(232, 232, 240, 0.5)' }}>
                        {r.service}
                      </div>
                    </div>
                    <div style={{
                      fontSize: 11, padding: '3px 8px', borderRadius: 10,
                      background: r.status === 'open' ? 'rgba(0, 214, 193, 0.2)' : 'rgba(255, 77, 95, 0.15)',
                      color: r.status === 'open' ? '#00d6c1' : 'rgba(255, 180, 190, 0.8)',
                    }}>
                      {r.status === 'open' ? 'OPEN' : 'TIMEOUT'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: HTTP Check */}
      {tab === 'http' && (
        <div>
          <div style={{
            padding: 16, borderRadius: 12, marginBottom: 16,
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                value={httpUrl}
                onChange={e => setHttpUrl(e.target.value)}
                placeholder="https://example.com"
                style={{
                  flex: 1, padding: '10px 14px', borderRadius: 8,
                  background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'monospace',
                }}
              />
              <button
                onClick={checkHttp}
                disabled={httpLoading}
                style={{
                  padding: '10px 24px', borderRadius: 8,
                  background: httpLoading ? 'rgba(124, 108, 240, 0.5)' : 'linear-gradient(135deg, #7c6cf0, #5b4cd8)',
                  border: 'none', color: '#fff', cursor: httpLoading ? 'wait' : 'pointer',
                  fontSize: 13, fontWeight: 600,
                }}
              >
                {httpLoading ? '检测中...' : '🌐 检测'}
              </button>
            </div>
            <div style={{ fontSize: 11, color: 'rgba(232, 232, 240, 0.4)', marginTop: 8 }}>
              注意: 由于浏览器 CORS 限制，部分站点可能无法获取完整响应头信息
            </div>
          </div>

          {httpResult && (
            <div style={{
              padding: 16, borderRadius: 12,
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 12,
                  background: httpResult.status && httpResult.status < 400
                    ? 'linear-gradient(135deg, rgba(0, 214, 193, 0.3), rgba(0, 214, 193, 0.1))'
                    : 'linear-gradient(135deg, rgba(255, 77, 95, 0.3), rgba(255, 77, 95, 0.1))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `1px solid ${httpResult.status && httpResult.status < 400 ? 'rgba(0, 214, 193, 0.4)' : 'rgba(255, 77, 95, 0.4)'}`,
                }}>
                  <div style={{
                    fontSize: 22, fontWeight: 700,
                    color: httpResult.status && httpResult.status < 400 ? '#00d6c1' : '#ff4d5f',
                  }}>
                    {httpResult.status || 'ERR'}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, wordBreak: 'break-all' }}>
                    {httpResult.url}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(232, 232, 240, 0.5)' }}>
                    {httpResult.error
                      ? `错误: ${httpResult.error}`
                      : `${httpResult.statusText} · 响应时间 ${httpResult.responseTime}ms`
                    }
                  </div>
                </div>
              </div>

              {httpResult.status && httpResult.headers && (
                <div>
                  <div style={{ fontSize: 11, color: 'rgba(232, 232, 240, 0.5)', marginBottom: 8 }}>响应头:</div>
                  <div style={{
                    maxHeight: 200, overflowY: 'auto',
                    background: 'rgba(0, 0, 0, 0.3)', borderRadius: 8, padding: 12,
                    fontFamily: 'monospace', fontSize: 11,
                  }}>
                    {Object.entries(httpResult.headers).map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', gap: 12, padding: '2px 0' }}>
                        <span style={{ color: '#b8a8ff', minWidth: 140 }}>{k}:</span>
                        <span style={{ color: 'rgba(232, 232, 240, 0.7)', wordBreak: 'break-all' }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab: ASN */}
      {tab === 'asn' && (
        <div>
          <div style={{
            padding: 16, borderRadius: 12, marginBottom: 16,
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                value={asnInput}
                onChange={e => setAsnInput(e.target.value)}
                placeholder="IP 地址或 ASN 号 (如 8.8.8.8 或 AS15169)"
                style={{
                  flex: 1, padding: '10px 14px', borderRadius: 8,
                  background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'monospace',
                }}
              />
              <button
                onClick={lookupAsn}
                disabled={asnLoading}
                style={{
                  padding: '10px 24px', borderRadius: 8,
                  background: asnLoading ? 'rgba(124, 108, 240, 0.5)' : 'linear-gradient(135deg, #7c6cf0, #5b4cd8)',
                  border: 'none', color: '#fff', cursor: asnLoading ? 'wait' : 'pointer',
                  fontSize: 13, fontWeight: 600,
                }}
              >
                {asnLoading ? '查询中...' : '🏢 查询'}
              </button>
            </div>
          </div>

          {asnData && (
            <div style={{
              padding: 16, borderRadius: 12,
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
                {asnData.ip && <InfoRow label="IP" value={asnData.ip} />}
                {asnData.version && <InfoRow label="版本" value={asnData.version} />}
                {asnData.city && <InfoRow label="城市" value={asnData.city} />}
                {asnData.region && <InfoRow label="行政区" value={asnData.region} />}
                {asnData.country_name && <InfoRow label="国家" value={asnData.country_name} />}
                {asnData.continent_code && <InfoRow label="大洲" value={asnData.continent_code} />}
                {asnData.timezone && <InfoRow label="时区" value={asnData.timezone} />}
                {asnData.isp && <InfoRow label="ISP" value={asnData.isp} />}
                {asnData.org && <InfoRow label="组织" value={asnData.org} />}
                {asnData.asn && <InfoRow label="ASN" value={asnData.asn} />}
                {asnData.currency && <InfoRow label="货币" value={asnData.currency} />}
                {asnData.latitude && <InfoRow label="纬度" value={String(asnData.latitude)} />}
                {asnData.longitude && <InfoRow label="经度" value={String(asnData.longitude)} />}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      padding: 10, borderRadius: 8,
      background: 'rgba(0, 0, 0, 0.25)',
      border: '1px solid rgba(255, 255, 255, 0.06)',
    }}>
      <div style={{ fontSize: 10, color: 'rgba(232, 232, 240, 0.4)', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, wordBreak: 'break-all' }}>{value}</div>
    </div>
  )
}
