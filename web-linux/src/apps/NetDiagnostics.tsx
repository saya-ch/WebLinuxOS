import { useState, useCallback, useRef } from 'react'
import {
  Globe,
  Search,
  Zap,
  Plug,
  Network,
  Download,
  Copy,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Loader2,
  Server,
  FileJson,
  AlertTriangle,
} from 'lucide-react'
import { useStore } from '../store'

type TabType = 'dns' | 'http' | 'port' | 'subdomain'

type DnsRecordType = 'A' | 'AAAA' | 'MX' | 'NS' | 'TXT' | 'CNAME' | 'SOA'

interface DnsResult {
  type: DnsRecordType
  records: { value: string; ttl?: number }[]
  time: number
  raw?: any
}

interface HttpResult {
  url: string
  method: 'GET' | 'HEAD'
  status?: number
  statusText?: string
  responseTime?: number
  headers?: Record<string, string>
  error?: string
}

interface PortResult {
  port: number
  status: 'open' | 'closed' | 'timeout' | 'error'
  service: string
  responseTime?: number
}

interface SubdomainResult {
  source: string
  subdomains: string[]
  time: number
}

interface AllResults {
  dns: DnsResult[]
  http: HttpResult | null
  ports: PortResult[]
  subdomains: SubdomainResult[]
  exportedAt: string
}

const DNS_TYPES: DnsRecordType[] = ['A', 'AAAA', 'MX', 'NS', 'TXT', 'CNAME', 'SOA']

const COMMON_PORTS: { port: number; service: string }[] = [
  { port: 21, service: 'FTP' },
  { port: 22, service: 'SSH' },
  { port: 25, service: 'SMTP' },
  { port: 53, service: 'DNS' },
  { port: 80, service: 'HTTP' },
  { port: 110, service: 'POP3' },
  { port: 143, service: 'IMAP' },
  { port: 443, service: 'HTTPS' },
  { port: 3306, service: 'MySQL' },
  { port: 5432, service: 'PostgreSQL' },
  { port: 6379, service: 'Redis' },
  { port: 8080, service: 'HTTP-Alt' },
  { port: 8443, service: 'HTTPS-Alt' },
]

const CLOUDFLARE_DOH = 'https://cloudflare-dns.com/dns-query'

export default function NetDiagnostics() {
  const [tab, setTab] = useState<TabType>('dns')

  const [domain, setDomain] = useState('')
  const [dnsType, setDnsType] = useState<DnsRecordType>('A')
  const [dnsResults, setDnsResults] = useState<DnsResult[]>([])
  const [dnsLoading, setDnsLoading] = useState(false)

  const [httpUrl, setHttpUrl] = useState('')
  const [httpMethod, setHttpMethod] = useState<'GET' | 'HEAD'>('GET')
  const [httpResult, setHttpResult] = useState<HttpResult | null>(null)
  const [httpLoading, setHttpLoading] = useState(false)

  const [portHost, setPortHost] = useState('')
  const [portResults, setPortResults] = useState<PortResult[]>([])
  const [portLoading, setPortLoading] = useState(false)
  const [selectedPorts, setSelectedPorts] = useState<number[]>(COMMON_PORTS.map((p) => p.port))
  const [customPort, setCustomPort] = useState('')
  const [portScanProgress, setPortScanProgress] = useState(0)

  const [subdomainDomain, setSubdomainDomain] = useState('')
  const [subdomainResults, setSubdomainResults] = useState<SubdomainResult[]>([])
  const [subdomainLoading, setSubdomainLoading] = useState(false)

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    dns: true,
    http: true,
    ports: true,
    subdomains: true,
  })

  const abortRef = useRef<AbortController | null>(null)
  const addNotification = useStore((s) => s.addNotification)

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const resolveDns = useCallback(async () => {
    if (!domain.trim()) {
      addNotification({ title: 'DNS 诊断', message: '请输入域名', type: 'warning' })
      return
    }
    setDnsLoading(true)
    setDnsResults([])
    const startTime = performance.now()

    try {
      const url = `${CLOUDFLARE_DOH}?name=${encodeURIComponent(domain.trim())}&type=${dnsType}`
      const res = await fetch(url, {
        headers: { Accept: 'application/dns-json' },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()

      const records: { value: string; ttl?: number }[] = []
      if (data.Answer) {
        for (const record of data.Answer) {
          let value = record.data
          if (record.type === 5) value = `CNAME → ${record.data}`
          if (record.type === 15) {
            const parts = record.data.split(' ')
            value = `MX ${parts[1]} (priority: ${parts[0]})`
          }
          if (record.type === 6) {
            const parts = record.data.split(' ')
            value = `SOA: ${parts[0]} ${parts[1]} serial=${parts[2]} refresh=${parts[3]} retry=${parts[4]} expire=${parts[5]} minimum=${parts[6]}`
          }
          records.push({ value, ttl: record.TTL })
        }
      }

      const elapsed = Math.round(performance.now() - startTime)
      setDnsResults([{ type: dnsType, records, time: elapsed, raw: data }])
      addNotification({
        title: 'DNS 诊断',
        message: `查询完成，找到 ${records.length} 条记录`,
        type: 'success',
      })
    } catch (err: any) {
      setDnsResults([{ type: dnsType, records: [], time: Math.round(performance.now() - startTime) }])
      addNotification({ title: 'DNS 诊断', message: `查询失败: ${err.message}`, type: 'error' })
    } finally {
      setDnsLoading(false)
    }
  }, [domain, dnsType, addNotification])

  const checkHttp = useCallback(async () => {
    let url = httpUrl.trim()
    if (!url) {
      addNotification({ title: 'HTTP 测试', message: '请输入 URL', type: 'warning' })
      return
    }
    if (!url.startsWith('http')) url = 'https://' + url

    setHttpLoading(true)
    setHttpResult(null)
    const startTime = performance.now()

    try {
      if (abortRef.current) abortRef.current.abort()
      const controller = new AbortController()
      abortRef.current = controller
      const timeoutId = setTimeout(() => controller.abort(), 15000)

      const res = await fetch(url, {
        method: httpMethod,
        mode: 'cors',
        cache: 'no-store',
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      const elapsed = Math.round(performance.now() - startTime)
      const headers: Record<string, string> = {}
      res.headers.forEach((value, key) => {
        headers[key] = value
      })

      setHttpResult({
        url,
        method: httpMethod,
        status: res.status,
        statusText: res.statusText,
        responseTime: elapsed,
        headers,
      })
      addNotification({
        title: 'HTTP 测试',
        message: `${res.status} ${res.statusText} · ${elapsed}ms`,
        type: res.status < 400 ? 'success' : 'warning',
      })
    } catch (err: any) {
      const elapsed = Math.round(performance.now() - startTime)
      setHttpResult({
        url,
        method: httpMethod,
        status: 0,
        error: err.name === 'AbortError' ? '请求超时 (15s)' : err.message,
        responseTime: elapsed,
      })
      addNotification({ title: 'HTTP 测试', message: `连接失败: ${err.message}`, type: 'error' })
    } finally {
      setHttpLoading(false)
    }
  }, [httpUrl, httpMethod, addNotification])

  const scanPort = useCallback(async (host: string, port: number): Promise<PortResult> => {
    const startTime = performance.now()
    const service = COMMON_PORTS.find((p) => p.port === port)?.service || 'Unknown'

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 4000)

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
        responseTime: Math.round(performance.now() - startTime),
      }
    } catch (err: any) {
      const status: PortResult['status'] =
        err.name === 'AbortError' ? 'timeout' : err.message?.includes('Failed to fetch') ? 'open' : 'error'
      return {
        port,
        status,
        service,
        responseTime: Math.round(performance.now() - startTime),
      }
    }
  }, [])

  const scanPorts = useCallback(async () => {
    if (!portHost.trim()) {
      addNotification({ title: '端口扫描', message: '请输入主机名或 IP', type: 'warning' })
      return
    }
    setPortLoading(true)
    setPortResults([])
    setPortScanProgress(0)

    const portsToScan = selectedPorts.length > 0 ? selectedPorts : COMMON_PORTS.map((p) => p.port)
    const results: PortResult[] = []

    for (let i = 0; i < portsToScan.length; i++) {
      const port = portsToScan[i]
      const result = await scanPort(portHost.trim(), port)
      results.push(result)
      setPortResults([...results])
      setPortScanProgress(Math.round(((i + 1) / portsToScan.length) * 100))
    }

    setPortLoading(false)
    const openCount = results.filter((r) => r.status === 'open').length
    addNotification({
      title: '端口扫描',
      message: `扫描完成，发现 ${openCount} 个开放端口`,
      type: 'success',
    })
  }, [portHost, selectedPorts, scanPort, addNotification])

  const runSubdomainDiscovery = useCallback(async () => {
    if (!subdomainDomain.trim()) {
      addNotification({ title: '子域名发现', message: '请输入域名', type: 'warning' })
      return
    }
    setSubdomainLoading(true)
    setSubdomainResults([])
    const startTime = performance.now()
    const domainClean = subdomainDomain.trim().replace(/^https?:\/\//, '').replace(/^www\./, '')

    const allSubdomains = new Set<string>()
    const sources: { source: string; subdomains: string[] }[] = []

    try {
      const crtUrl = `https://crt.sh/?q=%25.${encodeURIComponent(domainClean)}&output=json`
      const res = await fetch(crtUrl)
      if (res.ok) {
        const data = await res.json()
        const subs = new Set<string>()
        if (Array.isArray(data)) {
          for (const entry of data) {
            if (entry.name_value) {
              const names: string[] = Array.isArray(entry.name_value)
                ? entry.name_value
                : [entry.name_value]
              for (const name of names) {
                name.split('\n').forEach((n: string) => {
                  const clean = n.trim().toLowerCase()
                  if (clean.endsWith(`.${domainClean}`) && clean !== domainClean) {
                    subs.add(clean)
                    allSubdomains.add(clean)
                  }
                })
              }
            }
          }
        }
        sources.push({ source: 'crt.sh (证书透明度日志)', subdomains: Array.from(subs) })
      }
    } catch {
      sources.push({ source: 'crt.sh', subdomains: [] })
    }

    try {
      const url = `https://api.hackertarget.com/hostsearch/?q=${encodeURIComponent(domainClean)}`
      const res = await fetch(url)
      if (res.ok) {
        const text = await res.text()
        const subs = new Set<string>()
        text.split('\n').forEach((line) => {
          const parts = line.split(',')
          if (parts.length > 0) {
            const sub = parts[0].trim().toLowerCase()
            if (sub.endsWith(`.${domainClean}`) && sub !== domainClean) {
              subs.add(sub)
              allSubdomains.add(sub)
            }
          }
        })
        sources.push({ source: 'hackertarget.com', subdomains: Array.from(subs) })
      }
    } catch {
      sources.push({ source: 'hackertarget.com', subdomains: [] })
    }

    const elapsed = Math.round(performance.now() - startTime)
    const totalResults: SubdomainResult[] = sources
      .filter((s) => s.subdomains.length > 0)
      .map((s) => ({ source: s.source, subdomains: s.subdomains, time: elapsed }))

    if (totalResults.length === 0) {
      totalResults.push({
        source: '综合结果',
        subdomains: Array.from(allSubdomains),
        time: elapsed,
      })
    }

    setSubdomainResults(totalResults)
    const count = totalResults.reduce((sum, r) => sum + r.subdomains.length, 0)
    addNotification({
      title: '子域名发现',
      message: `发现 ${count} 个子域名`,
      type: count > 0 ? 'success' : 'warning',
    })
  }, [subdomainDomain, addNotification])

  const togglePort = (port: number) => {
    setSelectedPorts((prev) =>
      prev.includes(port) ? prev.filter((p) => p !== port) : [...prev, port].sort((a, b) => a - b)
    )
  }

  const addCustomPort = () => {
    const p = parseInt(customPort)
    if (p >= 1 && p <= 65535 && !selectedPorts.includes(p)) {
      setSelectedPorts((prev) => [...prev, p].sort((a, b) => a - b))
      setCustomPort('')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      addNotification({ title: '已复制', message: '内容已复制到剪贴板', type: 'success' })
    })
  }

  const exportAll = () => {
    const all: AllResults = {
      dns: dnsResults,
      http: httpResult,
      ports: portResults,
      subdomains: subdomainResults,
      exportedAt: new Date().toISOString(),
    }
    const json = JSON.stringify(all, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `net-diagnostics-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    addNotification({ title: '导出成功', message: '结果已导出为 JSON 文件', type: 'success' })
  }

  const exportCurrentTab = () => {
    let data: any = null
    let label = ''
    switch (tab) {
      case 'dns':
        data = dnsResults
        label = 'dns'
        break
      case 'http':
        data = httpResult
        label = 'http'
        break
      case 'port':
        data = portResults
        label = 'ports'
        break
      case 'subdomain':
        data = subdomainResults
        label = 'subdomains'
        break
    }
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `net-diagnostics-${label}-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    addNotification({ title: '导出成功', message: `${label.toUpperCase()} 结果已导出`, type: 'success' })
  }

  const hasAnyResults =
    dnsResults.length > 0 ||
    httpResult !== null ||
    portResults.length > 0 ||
    subdomainResults.length > 0

  return (
    <div
      style={{
        height: '100%',
        overflowY: 'auto',
        padding: 0,
        background: 'linear-gradient(135deg, #0a0a0f 0%, #0e0e1a 50%, #0a0a14 100%)',
        color: '#e0e0e8',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Header />

      <div style={{ flex: 1, padding: '0 20px 20px' }}>
        <TabBar tab={tab} setTab={setTab} />

        {tab === 'dns' && (
          <DnsPanel
            domain={domain}
            setDomain={setDomain}
            dnsType={dnsType}
            setDnsType={setDnsType}
            dnsLoading={dnsLoading}
            dnsResults={dnsResults}
            resolveDns={resolveDns}
            copyToClipboard={copyToClipboard}
            expanded={expandedSections.dns}
            onToggle={() => toggleSection('dns')}
          />
        )}

        {tab === 'http' && (
          <HttpPanel
            url={httpUrl}
            setUrl={setHttpUrl}
            method={httpMethod}
            setMethod={setHttpMethod}
            loading={httpLoading}
            result={httpResult}
            onCheck={checkHttp}
            copyToClipboard={copyToClipboard}
            expanded={expandedSections.http}
            onToggle={() => toggleSection('http')}
          />
        )}

        {tab === 'port' && (
          <PortPanel
            host={portHost}
            setHost={setPortHost}
            loading={portLoading}
            results={portResults}
            selectedPorts={selectedPorts}
            togglePort={togglePort}
            customPort={customPort}
            setCustomPort={setCustomPort}
            addCustomPort={addCustomPort}
            onScan={scanPorts}
            progress={portScanProgress}
            copyToClipboard={copyToClipboard}
            expanded={expandedSections.ports}
            onToggle={() => toggleSection('ports')}
          />
        )}

        {tab === 'subdomain' && (
          <SubdomainPanel
            domain={subdomainDomain}
            setDomain={setSubdomainDomain}
            loading={subdomainLoading}
            results={subdomainResults}
            onDiscover={runSubdomainDiscovery}
            copyToClipboard={copyToClipboard}
            expanded={expandedSections.subdomains}
            onToggle={() => toggleSection('subdomains')}
          />
        )}

        {hasAnyResults && (
          <div
            style={{
              marginTop: 20,
              padding: 16,
              borderRadius: 12,
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileJson size={18} style={{ color: '#7c6cf0' }} />
              <span style={{ fontSize: 13, color: 'rgba(232, 232, 240, 0.7)' }}>
                数据导出 · 将所有诊断结果导出为 JSON 格式保存
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={exportCurrentTab}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  background: 'rgba(124, 108, 240, 0.15)',
                  border: '1px solid rgba(124, 108, 240, 0.4)',
                  color: '#b8a8ff',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Download size={14} />
                导出当前
              </button>
              <button
                onClick={exportAll}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #7c6cf0, #5b4cd8)',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 0 20px rgba(124, 108, 240, 0.3)',
                }}
              >
                <Download size={14} />
                导出全部
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Header() {
  return (
    <div
      style={{
        padding: '20px 24px',
        background: 'linear-gradient(135deg, rgba(124, 108, 240, 0.12), rgba(0, 214, 193, 0.08))',
        borderBottom: '1px solid rgba(124, 108, 240, 0.2)',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 14,
          background: 'linear-gradient(135deg, #7c6cf0, #00d6c1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 30px rgba(124, 108, 240, 0.4)',
        }}
      >
        <Network size={26} color="#fff" />
      </div>
      <div>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '0.3px' }}>网络诊断工具</div>
        <div style={{ fontSize: 12, color: 'rgba(232, 232, 240, 0.5)', marginTop: 2 }}>
          DNS 解析 · HTTP 测试 · 端口检测 · 子域名发现 · 一站式网络诊断
        </div>
      </div>
    </div>
  )
}

function TabBar({ tab, setTab }: { tab: TabType; setTab: (t: TabType) => void }) {
  const tabs: { key: TabType; label: string; icon: React.ReactNode }[] = [
    { key: 'dns', label: 'DNS 查询', icon: <Globe size={16} /> },
    { key: 'http', label: 'HTTP 测试', icon: <Zap size={16} /> },
    { key: 'port', label: '端口检查', icon: <Plug size={16} /> },
    { key: 'subdomain', label: '子域名发现', icon: <Search size={16} /> },
  ]

  return (
    <div style={{ display: 'flex', gap: 4, margin: '16px 0', flexWrap: 'wrap' }}>
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => setTab(t.key)}
          style={{
            padding: '10px 20px',
            borderRadius: 10,
            background:
              tab === t.key
                ? 'linear-gradient(135deg, rgba(124, 108, 240, 0.8), rgba(0, 214, 193, 0.6))'
                : 'rgba(255, 255, 255, 0.04)',
            border:
              tab === t.key
                ? '1px solid rgba(124, 108, 240, 0.6)'
                : '1px solid rgba(255, 255, 255, 0.08)',
            color: tab === t.key ? '#fff' : 'rgba(232, 232, 240, 0.6)',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'all 0.2s',
            boxShadow: tab === t.key ? '0 0 20px rgba(124, 108, 240, 0.3)' : 'none',
          }}
        >
          {t.icon}
          {t.label}
        </button>
      ))}
    </div>
  )
}

/* ============ DNS Panel ============ */

function DnsPanel(props: {
  domain: string
  setDomain: (v: string) => void
  dnsType: DnsRecordType
  setDnsType: (v: DnsRecordType) => void
  dnsLoading: boolean
  dnsResults: DnsResult[]
  resolveDns: () => void
  copyToClipboard: (text: string) => void
  expanded: boolean
  onToggle: () => void
}) {
  const { domain, setDomain, dnsType, setDnsType, dnsLoading, dnsResults, resolveDns } = props

  return (
    <div>
      <SectionCard
        title="DNS 记录查询"
        icon={<Globe size={18} />}
        subtitle="使用 Cloudflare DoH API 查询域名 DNS 记录"
        expanded={props.expanded}
        onToggle={props.onToggle}
      >
        <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && resolveDns()}
            placeholder="输入域名 (example.com)"
            style={{
              flex: 1,
              minWidth: 200,
              padding: '10px 14px',
              borderRadius: 8,
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#fff',
              fontSize: 13,
              outline: 'none',
            }}
          />
          <select
            value={dnsType}
            onChange={(e) => setDnsType(e.target.value as DnsRecordType)}
            style={{
              padding: '10px 14px',
              borderRadius: 8,
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#fff',
              fontSize: 13,
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            {DNS_TYPES.map((t) => (
              <option key={t} value={t} style={{ background: '#12121f' }}>
                {t}
              </option>
            ))}
          </select>
          <button
            onClick={resolveDns}
            disabled={dnsLoading}
            style={{
              padding: '10px 24px',
              borderRadius: 8,
              background: dnsLoading
                ? 'rgba(124, 108, 240, 0.5)'
                : 'linear-gradient(135deg, #7c6cf0, #5b4cd8)',
              border: 'none',
              color: '#fff',
              cursor: dnsLoading ? 'wait' : 'pointer',
              fontSize: 13,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: dnsLoading ? 'none' : '0 0 20px rgba(124, 108, 240, 0.4)',
            }}
          >
            {dnsLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                查询中...
              </>
            ) : (
              <>
                <Search size={14} />
                查询
              </>
            )}
          </button>
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {DNS_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setDnsType(t)}
              style={{
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: 11,
                background: dnsType === t ? 'rgba(124, 108, 240, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${
                  dnsType === t ? 'rgba(124, 108, 240, 0.5)' : 'rgba(255, 255, 255, 0.08)'
                }`,
                color: dnsType === t ? '#b8a8ff' : 'rgba(232, 232, 240, 0.6)',
                cursor: 'pointer',
                fontFamily: 'monospace',
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </SectionCard>

      {dnsResults.map((result, idx) => (
        <div
          key={idx}
          style={{
            padding: 16,
            borderRadius: 12,
            marginTop: 12,
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 12,
              alignItems: 'center',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600 }}>
              <span style={{ color: '#b8a8ff' }}>{result.type}</span> 记录
              <span style={{ color: 'rgba(232, 232, 240, 0.4)', fontSize: 11, marginLeft: 12 }}>
                {result.records.length} 条结果 · {result.time}ms
              </span>
            </div>
          </div>
          {result.records.length === 0 ? (
            <div
              style={{
                padding: 20,
                textAlign: 'center',
                color: 'rgba(232, 232, 240, 0.4)',
                fontSize: 13,
              }}
            >
              未找到记录
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {result.records.map((r, i) => (
                <div
                  key={i}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: 'rgba(0, 0, 0, 0.25)',
                    border: '1px solid rgba(124, 108, 240, 0.15)',
                    fontFamily: 'monospace',
                    fontSize: 13,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ wordBreak: 'break-all' }}>{r.value}</span>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {r.ttl !== undefined && (
                      <span style={{ fontSize: 10, color: 'rgba(232, 232, 240, 0.4)' }}>
                        TTL: {r.ttl}
                      </span>
                    )}
                    <button
                      onClick={() => props.copyToClipboard(r.value)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        fontSize: 11,
                        background: 'rgba(124, 108, 240, 0.2)',
                        border: 'none',
                        color: '#b8a8ff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Copy size={12} />
                      复制
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

/* ============ HTTP Panel ============ */

function HttpPanel(props: {
  url: string
  setUrl: (v: string) => void
  method: 'GET' | 'HEAD'
  setMethod: (v: 'GET' | 'HEAD') => void
  loading: boolean
  result: HttpResult | null
  onCheck: () => void
  copyToClipboard: (text: string) => void
  expanded: boolean
  onToggle: () => void
}) {
  const { url, setUrl, method, setMethod, loading, result, onCheck } = props

  const getStatusColor = (status?: number) => {
    if (!status || status === 0) return '#ff4d5f'
    if (status < 300) return '#00d6c1'
    if (status < 400) return '#ffc107'
    if (status < 500) return '#ff9800'
    return '#ff4d5f'
  }

  const getStatusBg = (status?: number) => {
    if (!status || status === 0) return 'rgba(255, 77, 95, 0.15)'
    if (status < 300) return 'rgba(0, 214, 193, 0.15)'
    if (status < 400) return 'rgba(255, 193, 7, 0.15)'
    if (status < 500) return 'rgba(255, 152, 0, 0.15)'
    return 'rgba(255, 77, 95, 0.15)'
  }

  return (
    <div>
      <SectionCard
        title="HTTP 请求测试"
        icon={<Zap size={18} />}
        subtitle="对指定 URL 发起 GET / HEAD 请求，检测可达性"
        expanded={props.expanded}
        onToggle={props.onToggle}
      >
        <div style={{ display: 'flex', gap: 10 }}>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as 'GET' | 'HEAD')}
            style={{
              padding: '10px 14px',
              borderRadius: 8,
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#fff',
              fontSize: 13,
              fontWeight: 700,
              outline: 'none',
              cursor: 'pointer',
              fontFamily: 'monospace',
            }}
          >
            <option value="GET" style={{ background: '#12121f' }}>GET</option>
            <option value="HEAD" style={{ background: '#12121f' }}>HEAD</option>
          </select>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onCheck()}
            placeholder="https://example.com"
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: 8,
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#fff',
              fontSize: 13,
              outline: 'none',
              fontFamily: 'monospace',
            }}
          />
          <button
            onClick={onCheck}
            disabled={loading}
            style={{
              padding: '10px 24px',
              borderRadius: 8,
              background: loading
                ? 'rgba(124, 108, 240, 0.5)'
                : 'linear-gradient(135deg, #7c6cf0, #5b4cd8)',
              border: 'none',
              color: '#fff',
              cursor: loading ? 'wait' : 'pointer',
              fontSize: 13,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                测试中...
              </>
            ) : (
              <>
                <Zap size={14} />
                测试
              </>
            )}
          </button>
        </div>
        <div
          style={{
            fontSize: 11,
            color: 'rgba(232, 232, 240, 0.4)',
            marginTop: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <AlertTriangle size={12} />
          浏览器 CORS 限制：部分站点可能无法获取完整响应头信息
        </div>
      </SectionCard>

      {result && (
        <div
          style={{
            padding: 16,
            borderRadius: 12,
            marginTop: 12,
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 14,
                background: getStatusBg(result.status),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `1px solid ${getStatusColor(result.status)}40`,
              }}
            >
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: getStatusColor(result.status),
                  fontFamily: 'monospace',
                }}
              >
                {result.status || 'ERR'}
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  marginBottom: 4,
                  wordBreak: 'break-all',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: 4,
                    background: 'rgba(124, 108, 240, 0.2)',
                    color: '#b8a8ff',
                    fontSize: 11,
                    fontFamily: 'monospace',
                  }}
                >
                  {result.method}
                </span>
                {result.url}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(232, 232, 240, 0.5)' }}>
                {result.error ? (
                  <span style={{ color: '#ff4d5f' }}>错误: {result.error}</span>
                ) : (
                  <>
                    {result.statusText} · 响应时间{' '}
                    <span style={{ color: '#00d6c1', fontWeight: 600 }}>
                      {result.responseTime}ms
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {result.headers && Object.keys(result.headers).length > 0 && (
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: 'rgba(232, 232, 240, 0.5)',
                  marginBottom: 8,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>响应头 ({Object.keys(result.headers).length})</span>
                <button
                  onClick={() => props.copyToClipboard(JSON.stringify(result.headers, null, 2))}
                  style={{
                    padding: '3px 8px',
                    borderRadius: 4,
                    fontSize: 11,
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'rgba(232, 232, 240, 0.6)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <Copy size={10} />
                  复制全部
                </button>
              </div>
              <div
                style={{
                  maxHeight: 220,
                  overflowY: 'auto',
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: 8,
                  padding: 12,
                  fontFamily: 'monospace',
                  fontSize: 11,
                }}
              >
                {Object.entries(result.headers).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', gap: 12, padding: '2px 0' }}>
                    <span style={{ color: '#b8a8ff', minWidth: 160, flexShrink: 0 }}>{k}:</span>
                    <span style={{ color: 'rgba(232, 232, 240, 0.7)', wordBreak: 'break-all' }}>
                      {v}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!result.headers && !result.error && (
            <div
              style={{
                padding: 16,
                background: 'rgba(0, 0, 0, 0.2)',
                borderRadius: 8,
                textAlign: 'center',
                color: 'rgba(232, 232, 240, 0.4)',
                fontSize: 12,
              }}
            >
              由于浏览器 CORS 限制，无法获取响应头
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ============ Port Panel ============ */

function PortPanel(props: {
  host: string
  setHost: (v: string) => void
  loading: boolean
  results: PortResult[]
  selectedPorts: number[]
  togglePort: (port: number) => void
  customPort: string
  setCustomPort: (v: string) => void
  addCustomPort: () => void
  onScan: () => void
  progress: number
  copyToClipboard: (text: string) => void
  expanded: boolean
  onToggle: () => void
}) {
  const { host, setHost, loading, results, selectedPorts, togglePort, customPort, setCustomPort, addCustomPort, onScan, progress } = props

  const openCount = results.filter((r) => r.status === 'open').length
  const timeoutCount = results.filter((r) => r.status !== 'open').length

  return (
    <div>
      <SectionCard
        title="端口可达性检测"
        icon={<Plug size={18} />}
        subtitle="检测指定主机的常见端口可达性（通过 HTTPS 请求近似检测）"
        expanded={props.expanded}
        onToggle={props.onToggle}
      >
        <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
          <input
            value={host}
            onChange={(e) => setHost(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onScan()}
            placeholder="域名或 IP (example.com)"
            style={{
              flex: 1,
              minWidth: 200,
              padding: '10px 14px',
              borderRadius: 8,
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#fff',
              fontSize: 13,
              outline: 'none',
            }}
          />
          <input
            value={customPort}
            onChange={(e) => setCustomPort(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCustomPort()}
            placeholder="自定义端口 (1-65535)"
            style={{
              width: 160,
              padding: '10px 14px',
              borderRadius: 8,
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#fff',
              fontSize: 13,
              outline: 'none',
            }}
          />
          <button
            onClick={addCustomPort}
            style={{
              padding: '10px 16px',
              borderRadius: 8,
              background: 'rgba(0, 214, 193, 0.15)',
              border: '1px solid rgba(0, 214, 193, 0.4)',
              color: '#00d6c1',
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            + 添加
          </button>
          <button
            onClick={onScan}
            disabled={loading}
            style={{
              padding: '10px 24px',
              borderRadius: 8,
              background: loading
                ? 'rgba(124, 108, 240, 0.5)'
                : 'linear-gradient(135deg, #7c6cf0, #5b4cd8)',
              border: 'none',
              color: '#fff',
              cursor: loading ? 'wait' : 'pointer',
              fontSize: 13,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                扫描中 {progress}%
              </>
            ) : (
              <>
                <Plug size={14} />
                开始扫描
              </>
            )}
          </button>
        </div>

        {loading && (
          <div style={{ marginBottom: 14 }}>
            <div
              style={{
                height: 4,
                background: 'rgba(255, 255, 255, 0.08)',
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, #7c6cf0, #00d6c1)',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>
        )}

        <div
          style={{
            fontSize: 11,
            color: 'rgba(232, 232, 240, 0.4)',
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <AlertTriangle size={12} />
          浏览器限制：无法进行真正的 TCP 端口扫描，通过 HTTPS 请求近似检测
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {COMMON_PORTS.map((p) => (
            <button
              key={p.port}
              onClick={() => togglePort(p.port)}
              style={{
                padding: '5px 10px',
                borderRadius: 6,
                fontSize: 11,
                background: selectedPorts.includes(p.port)
                  ? 'rgba(0, 214, 193, 0.2)'
                  : 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${
                  selectedPorts.includes(p.port)
                    ? 'rgba(0, 214, 193, 0.5)'
                    : 'rgba(255, 255, 255, 0.08)'
                }`,
                color: selectedPorts.includes(p.port) ? '#00d6c1' : 'rgba(232, 232, 240, 0.6)',
                cursor: 'pointer',
                fontFamily: 'monospace',
              }}
            >
              {p.port} {p.service}
            </button>
          ))}
          {selectedPorts
            .filter((p) => !COMMON_PORTS.find((cp) => cp.port === p))
            .map((p) => (
              <button
                key={p}
                onClick={() => togglePort(p)}
                style={{
                  padding: '5px 10px',
                  borderRadius: 6,
                  fontSize: 11,
                  background: 'rgba(255, 193, 7, 0.15)',
                  border: '1px solid rgba(255, 193, 7, 0.4)',
                  color: '#ffc107',
                  cursor: 'pointer',
                  fontFamily: 'monospace',
                }}
              >
                {p} 自定义 ✕
              </button>
            ))}
        </div>
      </SectionCard>

      {results.length > 0 && (
        <div
          style={{
            padding: 16,
            borderRadius: 12,
            marginTop: 12,
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <CheckCircle size={14} style={{ color: '#00d6c1' }} />
              <span style={{ color: '#00d6c1' }}>开放 {openCount}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <XCircle size={14} style={{ color: '#ff4d5f' }} />
              <span style={{ color: '#ff4d5f' }}>不可达 {timeoutCount}</span>
            </div>
            <div style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(232, 232, 240, 0.4)' }}>
              共 {results.length} 个端口
            </div>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: 8,
            }}
          >
            {results.map((r, i) => (
              <div
                key={i}
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  background:
                    r.status === 'open' ? 'rgba(0, 214, 193, 0.08)' : 'rgba(255, 77, 95, 0.05)',
                  border: `1px solid ${
                    r.status === 'open'
                      ? 'rgba(0, 214, 193, 0.3)'
                      : 'rgba(255, 77, 95, 0.2)'
                  }`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'monospace' }}>
                    {r.port}
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(232, 232, 240, 0.5)' }}>
                    {r.service}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 10,
                    padding: '3px 8px',
                    borderRadius: 10,
                    background:
                      r.status === 'open'
                        ? 'rgba(0, 214, 193, 0.2)'
                        : 'rgba(255, 77, 95, 0.15)',
                    color: r.status === 'open' ? '#00d6c1' : 'rgba(255, 180, 190, 0.8)',
                    fontWeight: 700,
                  }}
                >
                  {r.status === 'open' ? 'OPEN' : 'CLOSED'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ============ Subdomain Panel ============ */

function SubdomainPanel(props: {
  domain: string
  setDomain: (v: string) => void
  loading: boolean
  results: SubdomainResult[]
  onDiscover: () => void
  copyToClipboard: (text: string) => void
  expanded: boolean
  onToggle: () => void
}) {
  const { domain, setDomain, loading, results, onDiscover } = props
  const totalSubdomains = results.reduce((sum, r) => sum + r.subdomains.length, 0)

  return (
    <div>
      <SectionCard
        title="子域名发现"
        icon={<Search size={18} />}
        subtitle="通过证书透明度日志和公开 API 发现子域名"
        expanded={props.expanded}
        onToggle={props.onToggle}
      >
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onDiscover()}
            placeholder="输入主域名 (example.com)"
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: 8,
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#fff',
              fontSize: 13,
              outline: 'none',
            }}
          />
          <button
            onClick={onDiscover}
            disabled={loading}
            style={{
              padding: '10px 24px',
              borderRadius: 8,
              background: loading
                ? 'rgba(124, 108, 240, 0.5)'
                : 'linear-gradient(135deg, #7c6cf0, #5b4cd8)',
              border: 'none',
              color: '#fff',
              cursor: loading ? 'wait' : 'pointer',
              fontSize: 13,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                扫描中...
              </>
            ) : (
              <>
                <Search size={14} />
                发现子域名
              </>
            )}
          </button>
        </div>
        <div
          style={{
            fontSize: 11,
            color: 'rgba(232, 232, 240, 0.4)',
            marginTop: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <AlertTriangle size={12} />
          使用 crt.sh (证书透明度) 和 HackerTarget 免费 API · 结果仅供参考
        </div>
      </SectionCard>

      {results.length > 0 && (
        <div
          style={{
            padding: 16,
            borderRadius: 12,
            marginTop: 12,
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 14,
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600 }}>
              发现结果 · 共 {totalSubdomains} 个子域名
            </div>
            <button
              onClick={() => {
                const all = results.flatMap((r) => r.subdomains)
                props.copyToClipboard(all.join('\n'))
              }}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                background: 'rgba(124, 108, 240, 0.15)',
                border: '1px solid rgba(124, 108, 240, 0.3)',
                color: '#b8a8ff',
                cursor: 'pointer',
                fontSize: 11,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Copy size={12} />
              复制全部
            </button>
          </div>

          {results.map((r, idx) => (
            <div key={idx} style={{ marginBottom: idx < results.length - 1 ? 14 : 0 }}>
              <div
                style={{
                  fontSize: 11,
                  color: 'rgba(232, 232, 240, 0.5)',
                  marginBottom: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Server size={12} />
                {r.source} · {r.subdomains.length} 个
              </div>
              <div
                style={{
                  maxHeight: 200,
                  overflowY: 'auto',
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: 8,
                  padding: 10,
                }}
              >
                {r.subdomains.length === 0 ? (
                  <div style={{ color: 'rgba(232, 232, 240, 0.3)', fontSize: 12, padding: 8 }}>
                    未发现子域名
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {r.subdomains.map((sub, i) => (
                      <a
                        key={i}
                        href={`https://${sub}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          padding: '4px 10px',
                          borderRadius: 6,
                          background: 'rgba(124, 108, 240, 0.15)',
                          border: '1px solid rgba(124, 108, 240, 0.3)',
                          color: '#b8a8ff',
                          fontSize: 11,
                          fontFamily: 'monospace',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          cursor: 'pointer',
                        }}
                      >
                        {sub}
                        <ExternalLink size={10} />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ============ Shared Components ============ */

function SectionCard(props: {
  title: string
  icon: React.ReactNode
  subtitle?: string
  children: React.ReactNode
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <div
      style={{
        padding: 16,
        borderRadius: 12,
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: props.expanded ? 14 : 0,
          cursor: 'pointer',
        }}
        onClick={props.onToggle}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'linear-gradient(135deg, rgba(124, 108, 240, 0.3), rgba(0, 214, 193, 0.2))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#b8a8ff',
            }}
          >
            {props.icon}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{props.title}</div>
            {props.subtitle && (
              <div style={{ fontSize: 11, color: 'rgba(232, 232, 240, 0.4)', marginTop: 2 }}>
                {props.subtitle}
              </div>
            )}
          </div>
        </div>
        <div style={{ color: 'rgba(232, 232, 240, 0.5)' }}>
          {props.expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </div>
      {props.expanded && <div>{props.children}</div>}
    </div>
  )
}