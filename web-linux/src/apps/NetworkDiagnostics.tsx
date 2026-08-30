import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Wifi, Search, Radio, Globe, Zap, Download, Activity,
  Loader2, CheckCircle2, XCircle, AlertTriangle,
  Copy, Check, Server, Clock, ArrowDown
} from 'lucide-react'

// ==================== 类型定义 ====================

interface NetworkInfo {
  type: string
  effectiveType: string
  downlink: number
  rtt: number
  saveData: boolean
  online: boolean
}

interface DNSRecord {
  type: string
  data: string
  ttl?: number
}

interface DNSQueryResult {
  domain: string
  records: DNSRecord[]
  status: string
  loading: boolean
  error: string | null
}

interface PortResult {
  name: string
  port: number
  status: 'open' | 'closed' | 'timeout' | 'pending'
  latency: number
}

interface WHOISResult {
  domain: string
  data: Record<string, string>
  loading: boolean
  error: string | null
}

interface PingResult {
  host: string
  times: number[]
  avg: number
  min: number
  max: number
  loss: number
  running: boolean
}

interface SpeedResult {
  downloadSpeed: number
  totalBytes: number
  duration: number
  running: boolean
  progress: number
}

// ==================== 常量 ====================

const DNS_RECORD_TYPES = ['A', 'AAAA', 'MX', 'TXT', 'NS', 'CNAME', 'SOA']

const PORT_SERVICES = [
  { name: 'HTTP', port: 80, protocol: 'http' },
  { name: 'HTTPS', port: 443, protocol: 'https' },
  { name: 'FTP', port: 21, protocol: 'ftp' },
  { name: 'SSH', port: 22, protocol: 'ssh' },
  { name: 'SMTP', port: 25, protocol: 'smtp' },
  { name: 'DNS', port: 53, protocol: 'dns' },
  { name: 'MySQL', port: 3306, protocol: 'mysql' },
  { name: 'Redis', port: 6379, protocol: 'redis' },
]

const COMMON_HOSTS = [
  'google.com', 'github.com', 'cloudflare.com', 'baidu.com',
  'mozilla.org', 'wikipedia.org', 'amazon.com', 'microsoft.com'
]

const PING_TARGETS = [
  'https://dns.google/resolve?name=example.com',
  'https://1.1.1.1/cdn-cgi/trace',
  'https://httpbin.org/get',
  'https://api.github.com/zen',
]

// ==================== 样式 ====================

const s = {
  root: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
    background: 'var(--window-bg, #0f0f1a)',
    color: 'var(--text-color, #e4e4e7)',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 16px',
    background: 'var(--card-bg, #1a1a2e)',
    borderBottom: '1px solid var(--window-border, #2a2a3e)',
    flexShrink: 0,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 15,
    fontWeight: 600,
    letterSpacing: 0.5,
  },
  tabs: {
    display: 'flex',
    gap: 2,
    padding: '6px 16px',
    background: 'var(--card-bg, #1a1a2e)',
    borderBottom: '1px solid var(--window-border, #2a2a3e)',
    overflowX: 'auto' as const,
    flexShrink: 0,
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '7px 14px',
    borderRadius: 8,
    border: 'none',
    background: 'transparent',
    color: 'var(--text-secondary, #9ca3af)',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 500,
    whiteSpace: 'nowrap' as const,
    transition: 'all 0.2s',
  },
  tabActive: {
    background: 'rgba(97, 175, 239, 0.12)',
    color: 'var(--accent, #61afef)',
  },
  content: {
    flex: 1,
    overflow: 'auto',
    padding: 16,
  },
  card: {
    background: 'var(--card-bg, #1a1a2e)',
    borderRadius: 10,
    border: '1px solid var(--window-border, #2a2a3e)',
    padding: 16,
    marginBottom: 12,
  },
  cardHead: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-secondary, #9ca3af)',
    marginBottom: 12,
  },
  inputRow: {
    display: 'flex',
    gap: 8,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px solid var(--window-border, #3a3a4e)',
    background: 'var(--window-bg, #0f0f1a)',
    color: 'var(--text-color, #e4e4e7)',
    fontSize: 13,
    fontFamily: "'Monaco', 'Menlo', monospace",
    outline: 'none',
  },
  btn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 16px',
    borderRadius: 8,
    border: 'none',
    background: 'rgba(97, 175, 239, 0.12)',
    color: 'var(--accent, #61afef)',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600,
    whiteSpace: 'nowrap' as const,
    transition: 'all 0.2s',
    flexShrink: 0,
  },
  btnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 10,
  },
  grid3: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 10,
  },
  grid4: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 10,
  },
  statBox: {
    background: 'var(--window-bg, #0f0f1a)',
    borderRadius: 8,
    padding: '12px 14px',
    border: '1px solid var(--window-border, #1e1e32)',
  },
  statLabel: {
    fontSize: 11,
    color: 'var(--text-secondary, #6b7280)',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 700,
    fontFamily: "'Monaco', 'Menlo', monospace",
    color: 'var(--accent, #61afef)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: 12,
  },
  th: {
    textAlign: 'left' as const,
    padding: '8px 10px',
    borderBottom: '1px solid var(--window-border, #2a2a3e)',
    color: 'var(--text-secondary, #6b7280)',
    fontWeight: 600,
    fontSize: 11,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  td: {
    padding: '8px 10px',
    borderBottom: '1px solid var(--window-border, #1e1e32)',
    fontFamily: "'Monaco', 'Menlo', monospace",
    fontSize: 12,
  },
  badge: (color: string) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '2px 8px',
    borderRadius: 10,
    fontSize: 11,
    fontWeight: 600,
    background: `${color}18`,
    color,
  }),
  progressTrack: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    background: 'var(--window-border, #2a2a3e)',
    overflow: 'hidden',
  },
  progressBar: (pct: number, color: string) => ({
    width: `${Math.min(100, pct)}%`,
    height: '100%',
    borderRadius: 3,
    background: color,
    transition: 'width 0.3s ease',
  }),
  copyBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '3px 8px',
    borderRadius: 6,
    border: '1px solid var(--window-border, #3a3a4e)',
    background: 'transparent',
    color: 'var(--text-secondary, #9ca3af)',
    cursor: 'pointer',
    fontSize: 11,
    transition: 'all 0.2s',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    color: 'var(--text-secondary, #6b7280)',
    fontSize: 13,
    gap: 8,
  },
}

// ==================== 工具函数 ====================

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1)
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function formatSpeed(mbps: number): string {
  if (mbps >= 1) return mbps.toFixed(2) + ' Mbps'
  return (mbps * 1024).toFixed(0) + ' Kbps'
}

// ==================== 主组件 ====================

export default function NetworkDiagnostics() {
  const [activeTab, setActiveTab] = useState('network')

  // ---- 网络信息 ----
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null)

  // ---- DNS 查询 ----
  const [dnsDomain, setDnsDomain] = useState('example.com')
  const [dnsType, setDnsType] = useState('A')
  const [dnsResult, setDnsResult] = useState<DNSQueryResult | null>(null)
  const [dnsLoading, setDnsLoading] = useState(false)
  const [dnsHistory, setDnsHistory] = useState<Array<{ domain: string; type: string; time: string }>>([])

  // ---- 端口扫描 ----
  const [portHost, setPortHost] = useState('example.com')
  const [portResults, setPortResults] = useState<PortResult[]>([])
  const [portScanning, setPortScanning] = useState(false)

  // ---- WHOIS ----
  const [whoisDomain, setWhoisDomain] = useState('example.com')
  const [whoisResult, setWhoisResult] = useState<WHOISResult | null>(null)
  const [whoisLoading, setWhoisLoading] = useState(false)

  // ---- Ping ----
  const [pingTarget, setPingTarget] = useState('https://httpbin.org/get')
  const [pingResult, setPingResult] = useState<PingResult | null>(null)
  const [pingHistory, setPingHistory] = useState<number[]>([])
  const pingAbortRef = useRef<AbortController | null>(null)

  // ---- Speed Test ----
  const [speedResult, setSpeedResult] = useState<SpeedResult | null>(null)
  const speedAbortRef = useRef<AbortController | null>(null)

  // ---- 通用 ----
  const [copiedText, setCopiedText] = useState<string | null>(null)

  // ========== 网络信息 ==========
  useEffect(() => {
    const update = () => {
      const nav = navigator as Navigator & { connection?: { effectiveType?: string; downlink?: number; rtt?: number; saveData?: boolean; type?: string } }
      const conn = nav.connection
      setNetworkInfo({
        type: conn?.type || 'unknown',
        effectiveType: conn?.effectiveType || 'unknown',
        downlink: conn?.downlink || 0,
        rtt: conn?.rtt || 0,
        saveData: conn?.saveData || false,
        online: navigator.onLine,
      })
    }
    update()
    const onOnline = () => update()
    const onOffline = () => update()
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    // connection API 变更事件
    const nav2 = navigator as Navigator & { connection?: { addEventListener?: (t: string, h: () => void) => void; removeEventListener?: (t: string, h: () => void) => void } }
    const connObj = nav2.connection
    if (connObj?.addEventListener) {
      connObj.addEventListener('change', update)
    }
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
      if (connObj?.removeEventListener) {
        connObj.removeEventListener('change', update)
      }
    }
  }, [])

  // ========== DNS 查询 ==========
  const queryDNS = useCallback(async () => {
    if (!dnsDomain.trim()) return
    setDnsLoading(true)
    setDnsResult({ domain: dnsDomain, records: [], status: '', loading: true, error: null })
    const typeMap: Record<string, number> = {
      A: 1, AAAA: 28, MX: 15, TXT: 16, NS: 2, CNAME: 5, SOA: 6,
    }
    const typeId = typeMap[dnsType] || 1
    try {
      const res = await fetch(
        `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(dnsDomain)}&type=${typeId}`,
        { headers: { 'accept': 'application/dns-json' } }
      )
      const data = await res.json()
      const records: DNSRecord[] = []
      if (data.Answer) {
        for (const ans of data.Answer) {
          records.push({
            type: DNS_RECORD_TYPES.find(t => {
              const map: Record<string, number> = { A: 1, AAAA: 28, MX: 15, TXT: 16, NS: 2, CNAME: 5, SOA: 6 }
              return map[t] === ans.type
            }) || String(ans.type),
            data: ans.data,
            ttl: ans.TTL,
          })
        }
      }
      setDnsResult({
        domain: dnsDomain,
        records,
        status: data.Status === 0 ? 'NOERROR' : `Status: ${data.Status}`,
        loading: false,
        error: null,
      })
      setDnsHistory(prev => [
        { domain: dnsDomain, type: dnsType, time: new Date().toLocaleTimeString('zh-CN') },
        ...prev.slice(0, 19),
      ])
    } catch (e) {
      setDnsResult({
        domain: dnsDomain,
        records: [],
        status: '',
        loading: false,
        error: e instanceof Error ? e.message : '查询失败',
      })
    } finally {
      setDnsLoading(false)
    }
  }, [dnsDomain, dnsType])

  // ========== 端口扫描 ==========
  const scanPorts = useCallback(async () => {
    if (!portHost.trim()) return
    setPortScanning(true)
    setPortResults(PORT_SERVICES.map(svc => ({
      name: svc.name,
      port: svc.port,
      status: 'pending' as const,
      latency: 0,
    })))
    const results: PortResult[] = []
    for (const svc of PORT_SERVICES) {
      const start = performance.now()
      let status: PortResult['status'] = 'closed'
      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 3000)
        const protocol = svc.protocol === 'https' ? 'https' : 'https'
        const url = `${protocol}://${portHost}:${svc.port}/`
        await fetch(url, {
          mode: 'no-cors',
          cache: 'no-store',
          signal: controller.signal,
        })
        clearTimeout(timeout)
        // no-cors 请求即使成功也无法读取数据
        // 但如果没抛异常，说明端口可达
        status = 'open'
      } catch {
        status = 'closed'
      }
      const latency = Math.round(performance.now() - start)
      results.push({ name: svc.name, port: svc.port, status, latency })
      setPortResults([...results, ...PORT_SERVICES.slice(results.length).map(svc2 => ({
        name: svc2.name, port: svc2.port, status: 'pending' as PortResult['status'], latency: 0,
      }))])
    }
    setPortResults(results)
    setPortScanning(false)
  }, [portHost])

  // ========== WHOIS 查询 ==========
  const queryWHOIS = useCallback(async () => {
    if (!whoisDomain.trim()) return
    setWhoisLoading(true)
    setWhoisResult({ domain: whoisDomain, data: {}, loading: true, error: null })
    try {
      // 使用 RDAP 公开 API 查询
      const res = await fetch(`https://rdap.verisign.com/com/v1/domain/${encodeURIComponent(whoisDomain)}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const info: Record<string, string> = {}
      if (data.ldhName) info['域名'] = data.ldhName
      if (data.status) info['状态'] = data.status.join(', ')
      if (data.events) {
        for (const ev of data.events) {
          if (ev.eventAction === 'registration') {
            info['注册日期'] = new Date(ev.eventDate).toLocaleDateString('zh-CN')
          }
          if (ev.eventAction === 'expiration') {
            info['过期日期'] = new Date(ev.eventDate).toLocaleDateString('zh-CN')
          }
          if (ev.eventAction === 'last changed') {
            info['最后更新'] = new Date(ev.eventDate).toLocaleDateString('zh-CN')
          }
        }
      }
      if (data.nameservers) {
        info['域名服务器'] = data.nameservers.map((ns: { ldhName: string }) => ns.ldhName).join(', ')
      }
      if (data.handle) info['Handle'] = data.handle
      if (data.whoisServer) info['WHOIS 服务器'] = data.whoisServer
      setWhoisResult({ domain: whoisDomain, data: info, loading: false, error: null })
    } catch {
      // 回退：尝试使用 whois XML API
      try {
        const res = await fetch(`https://www.whoisxmlapi.com/whoisserver/WhoisService?domainName=${encodeURIComponent(whoisDomain)}&outputFormat=JSON&apiKey=at_demo`)
        const data = await res.json()
        const whoisRecord = data.WhoisRecord
        if (whoisRecord) {
          const info: Record<string, string> = {}
          if (whoisRecord.domainName) info['域名'] = whoisRecord.domainName
          if (whoisRecord.registrar) info['注册商'] = whoisRecord.registrar
          if (whoisRecord.createdDate) info['注册日期'] = whoisRecord.createdDate
          if (whoisRecord.expiresDate) info['过期日期'] = whoisRecord.expiresDate
          if (whoisRecord.updatedDate) info['最后更新'] = whoisRecord.updatedDate
          if (whoisRecord.nameServers) info['域名服务器'] = whoisRecord.nameServers.join(', ')
          if (whoisRecord.registryDomainId) info['Registry ID'] = whoisRecord.registryDomainId
          setWhoisResult({ domain: whoisDomain, data: info, loading: false, error: null })
        } else {
          throw new Error('No WHOIS data')
        }
      } catch {
        setWhoisResult({
          domain: whoisDomain,
          data: {},
          loading: false,
          error: '无法查询 WHOIS 信息，该域名可能不支持 RDAP 查询',
        })
      }
    } finally {
      setWhoisLoading(false)
    }
  }, [whoisDomain])

  // ========== Ping 测试 ==========
  const runPing = useCallback(async () => {
    if (!pingTarget.trim()) return
    const times: number[] = []
    let loss = 0
    const totalPings = 10

    setPingResult({
      host: pingTarget,
      times: [],
      avg: 0,
      min: 0,
      max: 0,
      loss: 0,
      running: true,
    })

    for (let i = 0; i < totalPings; i++) {
      try {
        const start = performance.now()
        await fetch(pingTarget + (pingTarget.includes('?') ? '&' : '?') + `_t=${Date.now()}`, {
          cache: 'no-store',
          mode: 'no-cors',
        })
        const time = Math.round(performance.now() - start)
        times.push(time)
      } catch {
        loss++
      }
      setPingResult(prev => prev ? {
        ...prev,
        times: [...times],
        loss: Math.round((loss / (i + 1)) * 100),
      } : null)
      // 短暂间隔
      await new Promise(r => setTimeout(r, 200))
    }

    const avg = times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0
    const min = times.length > 0 ? Math.min(...times) : 0
    const max = times.length > 0 ? Math.max(...times) : 0

    setPingResult({
      host: pingTarget,
      times,
      avg,
      min,
      max,
      loss: Math.round((loss / totalPings) * 100),
      running: false,
    })

    setPingHistory(prev => [...prev.slice(-19), avg])
  }, [pingTarget])

  // ========== 速度测试 ==========
  const runSpeedTest = useCallback(async () => {
    setSpeedResult({ downloadSpeed: 0, totalBytes: 0, duration: 0, running: true, progress: 0 })
    const startTime = performance.now()
    let totalBytes = 0
    const duration = 10 // 10秒测试
    const urls = [
      'https://speed.cloudflare.com/__down?bytes=1000000',
      'https://proof.ovh.net/files/10Mb.dat',
      'http://speedtest.tele2.net/10MB.zip',
    ]

    // 循环下载直到超时
    const endTime = startTime + duration * 1000

    while (performance.now() < endTime) {
      const url = urls[Math.floor(Math.random() * urls.length)]
      try {
        const res = await fetch(url + `?_t=${Date.now()}`, { cache: 'no-store' })
        const reader = res.body?.getReader()
        if (!reader) break
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          totalBytes += value.length
          const elapsed = (performance.now() - startTime) / 1000
          const speed = (totalBytes * 8) / (elapsed * 1000000) // Mbps
          setSpeedResult({
            downloadSpeed: speed,
            totalBytes,
            duration: elapsed,
            running: true,
            progress: Math.min(100, (elapsed / duration) * 100),
          })
          if (performance.now() >= endTime) {
            reader.cancel()
            break
          }
        }
      } catch {
        // 尝试下一个 URL
        continue
      }
    }

    const elapsed = (performance.now() - startTime) / 1000
    const speed = (totalBytes * 8) / (elapsed * 1000000)
    setSpeedResult({
      downloadSpeed: speed,
      totalBytes,
      duration: elapsed,
      running: false,
      progress: 100,
    })
  }, [])

  const stopSpeedTest = useCallback(() => {
    speedAbortRef.current?.abort()
    setSpeedResult(prev => prev ? { ...prev, running: false } : null)
  }, [])

  const stopPing = useCallback(() => {
    pingAbortRef.current?.abort()
    setPingResult(prev => prev ? { ...prev, running: false } : null)
  }, [])

  // ========== 复制 ==========
  const copyText = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedText(text)
      setTimeout(() => setCopiedText(null), 2000)
    } catch { /* ignore */ }
  }, [])

  // ========== Tab 配置 ==========
  const tabs = [
    { id: 'network', label: '网络信息', icon: <Wifi size={14} /> },
    { id: 'dns', label: 'DNS 查询', icon: <Search size={14} /> },
    { id: 'port', label: '端口扫描', icon: <Radio size={14} /> },
    { id: 'whois', label: 'WHOIS', icon: <Globe size={14} /> },
    { id: 'ping', label: 'Ping 测试', icon: <Zap size={14} /> },
    { id: 'speed', label: '速度测试', icon: <Download size={14} /> },
  ]

  // ========== 渲染：网络信息 ==========
  const renderNetworkInfo = () => (
    <div>
      <div style={s.card}>
        <div style={s.cardHead}>
          <Wifi size={15} style={{ color: 'var(--accent, #61afef)' }} />
          <span>网络连接信息</span>
          <span style={{
            ...s.badge(networkInfo?.online ? '#22c55e' : '#ef4444'),
            marginLeft: 'auto',
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: networkInfo?.online ? '#22c55e' : '#ef4444',
              display: 'inline-block',
            }} />
            {networkInfo?.online ? '在线' : '离线'}
          </span>
        </div>
        {networkInfo && (
          <div style={s.grid4}>
            <div style={s.statBox}>
              <div style={s.statLabel}>连接类型</div>
              <div style={{ ...s.statValue, fontSize: 16 }}>{networkInfo.effectiveType || '—'}</div>
            </div>
            <div style={s.statBox}>
              <div style={s.statLabel}>下行速度</div>
              <div style={{ ...s.statValue, fontSize: 16 }}>
                {networkInfo.downlink > 0 ? `${networkInfo.downlink}` : '—'}
                {networkInfo.downlink > 0 && <span style={{ fontSize: 11, color: 'var(--text-secondary, #6b7280)' }}> Mbps</span>}
              </div>
            </div>
            <div style={s.statBox}>
              <div style={s.statLabel}>RTT 延迟</div>
              <div style={{ ...s.statValue, fontSize: 16 }}>
                {networkInfo.rtt > 0 ? networkInfo.rtt : '—'}
                {networkInfo.rtt > 0 && <span style={{ fontSize: 11, color: 'var(--text-secondary, #6b7280)' }}> ms</span>}
              </div>
            </div>
            <div style={s.statBox}>
              <div style={s.statLabel}>网络类型</div>
              <div style={{ ...s.statValue, fontSize: 16 }}>{networkInfo.type || '—'}</div>
            </div>
          </div>
        )}
      </div>

      <div style={s.card}>
        <div style={s.cardHead}>
          <Server size={15} style={{ color: 'var(--accent, #61afef)' }} />
          <span>浏览器信息</span>
        </div>
        <div style={s.grid2}>
          <div style={s.statBox}>
            <div style={s.statLabel}>平台</div>
            <div style={{ ...s.statValue, fontSize: 13, wordBreak: 'break-all' }}>{navigator.platform || '—'}</div>
          </div>
          <div style={s.statBox}>
            <div style={s.statLabel}>硬件并发</div>
            <div style={{ ...s.statValue, fontSize: 13 }}>{navigator.hardwareConcurrency || '—'} 核</div>
          </div>
          <div style={s.statBox}>
            <div style={s.statLabel}>设备内存</div>
            <div style={{ ...s.statValue, fontSize: 13 }}>
              {(navigator as Navigator & { deviceMemory?: number }).deviceMemory
                ? `${(navigator as Navigator & { deviceMemory: number }).deviceMemory} GB`
                : '—'}
            </div>
          </div>
          <div style={s.statBox}>
            <div style={s.statLabel}>数据节省</div>
            <div style={{ ...s.statValue, fontSize: 13 }}>{networkInfo?.saveData ? '已开启' : '未开启'}</div>
          </div>
          <div style={s.statBox}>
            <div style={s.statLabel}>Cookie 启用</div>
            <div style={{ ...s.statValue, fontSize: 13 }}>{navigator.cookieEnabled ? '是' : '否'}</div>
          </div>
          <div style={s.statBox}>
            <div style={s.statLabel}>在线状态</div>
            <div style={{ ...s.statValue, fontSize: 13, color: navigator.onLine ? '#22c55e' : '#ef4444' }}>
              {navigator.onLine ? '在线' : '离线'}
            </div>
          </div>
          <div style={s.statBox}>
            <div style={s.statLabel}>Do Not Track</div>
            <div style={{ ...s.statValue, fontSize: 13 }}>{navigator.doNotTrack || '未设置'}</div>
          </div>
          <div style={s.statBox}>
            <div style={s.statLabel}>语言</div>
            <div style={{ ...s.statValue, fontSize: 13 }}>{navigator.language || '—'}</div>
          </div>
        </div>
      </div>

      <div style={s.card}>
        <div style={s.cardHead}>
          <Activity size={15} style={{ color: 'var(--accent, #61afef)' }} />
          <span>连接能力检测</span>
        </div>
        <div style={s.grid3}>
          {[
            { name: 'WebSocket', ok: typeof WebSocket !== 'undefined' },
            { name: 'WebRTC', ok: typeof RTCPeerConnection !== 'undefined' },
            { name: 'Fetch API', ok: typeof fetch !== 'undefined' },
            { name: 'Service Worker', ok: 'serviceWorker' in navigator },
            { name: 'Beacon API', ok: typeof navigator.sendBeacon === 'function' },
            { name: 'Network Info API', ok: 'connection' in navigator },
          ].map(cap => (
            <div key={cap.name} style={{
              ...s.statBox,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary, #9ca3af)' }}>{cap.name}</span>
              <span style={{
                ...s.badge(cap.ok ? '#22c55e' : '#ef4444'),
                fontSize: 10,
              }}>
                {cap.ok ? '可用' : '不可用'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  // ========== 渲染：DNS 查询 ==========
  const renderDNS = () => (
    <div>
      <div style={s.card}>
        <div style={s.cardHead}>
          <Search size={15} style={{ color: 'var(--accent, #61afef)' }} />
          <span>DNS-over-HTTPS 查询</span>
          <span style={{ fontSize: 11, color: 'var(--text-secondary, #6b7280)', marginLeft: 'auto' }}>
            Powered by Cloudflare 1.1.1.1
          </span>
        </div>
        <div style={s.inputRow}>
          <input
            style={s.input}
            value={dnsDomain}
            onChange={e => setDnsDomain(e.target.value)}
            placeholder="输入域名，如 example.com"
            onKeyDown={e => e.key === 'Enter' && queryDNS()}
          />
          <select
            style={{
              ...s.input,
              width: 'auto',
              minWidth: 90,
              cursor: 'pointer',
              flexShrink: 0,
            }}
            value={dnsType}
            onChange={e => setDnsType(e.target.value)}
          >
            {DNS_RECORD_TYPES.map(t => (
              <option key={t} value={t}>{t} 记录</option>
            ))}
          </select>
          <button
            style={{ ...s.btn, ...(dnsLoading ? s.btnDisabled : {}) }}
            onClick={queryDNS}
            disabled={dnsLoading}
          >
            {dnsLoading ? <Loader2 size={14} style={{ animation: 'ndSpin 1s linear infinite' }} /> : <Search size={14} />}
            {dnsLoading ? '查询中...' : '查询'}
          </button>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: 'var(--text-secondary, #6b7280)', lineHeight: '28px' }}>快捷:</span>
          {COMMON_HOSTS.slice(0, 6).map(host => (
            <button
              key={host}
              style={{
                ...s.btn,
                padding: '4px 10px',
                fontSize: 11,
                background: dnsDomain === host ? 'rgba(97, 175, 239, 0.2)' : 'rgba(255,255,255,0.04)',
                color: dnsDomain === host ? 'var(--accent, #61afef)' : 'var(--text-secondary, #9ca3af)',
              }}
              onClick={() => { setDnsDomain(host); }}
            >
              {host}
            </button>
          ))}
        </div>
      </div>

      {dnsResult && (
        <div style={s.card}>
          <div style={s.cardHead}>
            <Globe size={15} style={{ color: 'var(--accent, #61afef)' }} />
            <span>查询结果: {dnsResult.domain}</span>
            {dnsResult.status && (
              <span style={s.badge(dnsResult.error ? '#ef4444' : '#22c55e')}>{dnsResult.status}</span>
            )}
          </div>
          {dnsResult.error ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#ef4444', fontSize: 13 }}>
              <XCircle size={20} style={{ marginBottom: 6 }} />
              <div>{dnsResult.error}</div>
            </div>
          ) : dnsResult.records.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>类型</th>
                    <th style={s.th}>记录值</th>
                    <th style={s.th}>TTL</th>
                    <th style={s.th}></th>
                  </tr>
                </thead>
                <tbody>
                  {dnsResult.records.map((r, i) => (
                    <tr key={i}>
                      <td style={s.td}>
                        <span style={s.badge('#61afef')}>{r.type}</span>
                      </td>
                      <td style={{ ...s.td, wordBreak: 'break-all', maxWidth: 400 }}>
                        {r.data}
                      </td>
                      <td style={{ ...s.td, color: 'var(--text-secondary, #6b7280)' }}>
                        {r.ttl ?? '—'}
                      </td>
                      <td style={s.td}>
                        <button
                          style={s.copyBtn}
                          onClick={() => copyText(r.data)}
                        >
                          {copiedText === r.data ? <Check size={10} /> : <Copy size={10} />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={s.emptyState}>
              <Search size={24} />
              <span>无 {dnsType} 类型记录</span>
            </div>
          )}
        </div>
      )}

      {dnsHistory.length > 0 && (
        <div style={s.card}>
          <div style={s.cardHead}>
            <Clock size={15} style={{ color: 'var(--accent, #61afef)' }} />
            <span>查询历史</span>
          </div>
          <div style={{ maxHeight: 180, overflow: 'auto' }}>
            {dnsHistory.map((h, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '6px 0',
                borderBottom: i < dnsHistory.length - 1 ? '1px solid var(--window-border, #1e1e32)' : 'none',
                fontSize: 12,
              }}>
                <span style={{ fontFamily: "'Monaco', monospace", color: 'var(--text-color, #e4e4e7)' }}>
                  {h.domain}
                </span>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={s.badge('#61afef')}>{h.type}</span>
                  <span style={{ color: 'var(--text-secondary, #6b7280)' }}>{h.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  // ========== 渲染：端口扫描 ==========
  const renderPortScan = () => (
    <div>
      <div style={s.card}>
        <div style={s.cardHead}>
          <Radio size={15} style={{ color: 'var(--accent, #61afef)' }} />
          <span>端口可达性检测</span>
          <span style={{ fontSize: 11, color: 'var(--text-secondary, #6b7280)', marginLeft: 'auto' }}>
            通过 HTTP 请求模拟检测
          </span>
        </div>
        <div style={s.inputRow}>
          <input
            style={s.input}
            value={portHost}
            onChange={e => setPortHost(e.target.value)}
            placeholder="输入主机名或IP，如 example.com"
            onKeyDown={e => e.key === 'Enter' && scanPorts()}
          />
          <button
            style={{ ...s.btn, ...(portScanning ? s.btnDisabled : {}) }}
            onClick={scanPorts}
            disabled={portScanning}
          >
            {portScanning ? <Loader2 size={14} style={{ animation: 'ndSpin 1s linear infinite' }} /> : <Radio size={14} />}
            {portScanning ? '扫描中...' : '开始扫描'}
          </button>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: 'var(--text-secondary, #6b7280)', lineHeight: '28px' }}>快捷:</span>
          {COMMON_HOSTS.slice(0, 5).map(host => (
            <button
              key={host}
              style={{
                ...s.btn,
                padding: '4px 10px',
                fontSize: 11,
                background: portHost === host ? 'rgba(97, 175, 239, 0.2)' : 'rgba(255,255,255,0.04)',
                color: portHost === host ? 'var(--accent, #61afef)' : 'var(--text-secondary, #9ca3af)',
              }}
              onClick={() => setPortHost(host)}
            >
              {host}
            </button>
          ))}
        </div>
      </div>

      {portResults.length > 0 && (
        <div style={s.card}>
          <div style={s.cardHead}>
            <Server size={15} style={{ color: 'var(--accent, #61afef)' }} />
            <span>扫描结果: {portHost}</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>服务</th>
                  <th style={s.th}>端口</th>
                  <th style={s.th}>状态</th>
                  <th style={s.th}>延迟</th>
                </tr>
              </thead>
              <tbody>
                {portResults.map((r, i) => (
                  <tr key={i}>
                    <td style={{ ...s.td, fontWeight: 600 }}>{r.name}</td>
                    <td style={s.td}>{r.port}</td>
                    <td style={s.td}>
                      {r.status === 'pending' ? (
                        <span style={s.badge('#6b7280')}>检测中</span>
                      ) : r.status === 'open' ? (
                        <span style={s.badge('#22c55e')}>
                          <CheckCircle2 size={10} /> 开放
                        </span>
                      ) : (
                        <span style={s.badge('#ef4444')}>
                          <XCircle size={10} /> 关闭
                        </span>
                      )}
                    </td>
                    <td style={{ ...s.td, color: 'var(--text-secondary, #6b7280)' }}>
                      {r.status === 'pending' ? '—' : `${r.latency}ms`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{
            marginTop: 12, padding: '8px 12px', borderRadius: 8,
            background: 'rgba(255, 170, 0, 0.06)',
            fontSize: 11, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <AlertTriangle size={12} />
            说明：端口检测通过浏览器 HTTP(S) 请求模拟，由于浏览器安全限制，部分端口无法真实检测。
            "关闭" 状态可能表示端口不支持 HTTP 协议。
          </div>
        </div>
      )}
    </div>
  )

  // ========== 渲染：WHOIS ==========
  const renderWHOIS = () => (
    <div>
      <div style={s.card}>
        <div style={s.cardHead}>
          <Globe size={15} style={{ color: 'var(--accent, #61afef)' }} />
          <span>WHOIS / RDAP 域名查询</span>
          <span style={{ fontSize: 11, color: 'var(--text-secondary, #6b7280)', marginLeft: 'auto' }}>
            基于 Verisign RDAP 公开 API
          </span>
        </div>
        <div style={s.inputRow}>
          <input
            style={s.input}
            value={whoisDomain}
            onChange={e => setWhoisDomain(e.target.value)}
            placeholder="输入域名，如 example.com"
            onKeyDown={e => e.key === 'Enter' && queryWHOIS()}
          />
          <button
            style={{ ...s.btn, ...(whoisLoading ? s.btnDisabled : {}) }}
            onClick={queryWHOIS}
            disabled={whoisLoading}
          >
            {whoisLoading ? <Loader2 size={14} style={{ animation: 'ndSpin 1s linear infinite' }} /> : <Globe size={14} />}
            {whoisLoading ? '查询中...' : '查询'}
          </button>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: 'var(--text-secondary, #6b7280)', lineHeight: '28px' }}>快捷:</span>
          {['example.com', 'google.com', 'github.com', 'microsoft.com'].map(host => (
            <button
              key={host}
              style={{
                ...s.btn,
                padding: '4px 10px',
                fontSize: 11,
                background: whoisDomain === host ? 'rgba(97, 175, 239, 0.2)' : 'rgba(255,255,255,0.04)',
                color: whoisDomain === host ? 'var(--accent, #61afef)' : 'var(--text-secondary, #9ca3af)',
              }}
              onClick={() => setWhoisDomain(host)}
            >
              {host}
            </button>
          ))}
        </div>
      </div>

      {whoisResult && (
        <div style={s.card}>
          <div style={s.cardHead}>
            <Globe size={15} style={{ color: 'var(--accent, #61afef)' }} />
            <span>查询结果: {whoisResult.domain}</span>
          </div>
          {whoisResult.error ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#ef4444', fontSize: 13 }}>
              <AlertTriangle size={20} style={{ marginBottom: 6 }} />
              <div>{whoisResult.error}</div>
            </div>
          ) : whoisResult.loading ? (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-secondary, #6b7280)', fontSize: 13 }}>
              <Loader2 size={20} style={{ animation: 'ndSpin 1s linear infinite', marginBottom: 6 }} />
              <div>正在查询 RDAP 数据库...</div>
            </div>
          ) : Object.keys(whoisResult.data).length > 0 ? (
            <div>
              {Object.entries(whoisResult.data).map(([key, value]) => (
                <div key={key} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 0',
                  borderBottom: '1px solid var(--window-border, #1e1e32)',
                }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary, #9ca3af)', minWidth: 100 }}>{key}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      fontSize: 12, fontFamily: "'Monaco', monospace",
                      color: 'var(--text-color, #e4e4e7)', textAlign: 'right',
                      wordBreak: 'break-all', maxWidth: 400,
                    }}>
                      {value}
                    </span>
                    <button style={s.copyBtn} onClick={() => copyText(value)}>
                      {copiedText === value ? <Check size={10} /> : <Copy size={10} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={s.emptyState}>
              <Globe size={24} />
              <span>无 WHOIS 数据</span>
            </div>
          )}
        </div>
      )}
    </div>
  )

  // ========== 渲染：Ping 测试 ==========
  const renderPing = () => (
    <div>
      <div style={s.card}>
        <div style={s.cardHead}>
          <Zap size={15} style={{ color: 'var(--accent, #61afef)' }} />
          <span>Ping 延迟测试</span>
          <span style={{ fontSize: 11, color: 'var(--text-secondary, #6b7280)', marginLeft: 'auto' }}>
            通过 API 请求往返时间模拟 Ping
          </span>
        </div>
        <div style={s.inputRow}>
          <input
            style={s.input}
            value={pingTarget}
            onChange={e => setPingTarget(e.target.value)}
            placeholder="输入测试 URL"
            onKeyDown={e => e.key === 'Enter' && !pingResult?.running && runPing()}
          />
          {pingResult?.running ? (
            <button
              style={{ ...s.btn, background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' }}
              onClick={stopPing}
            >
              <XCircle size={14} /> 停止
            </button>
          ) : (
            <button
              style={s.btn}
              onClick={runPing}
            >
              <Zap size={14} /> 开始测试
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: 'var(--text-secondary, #6b7280)', lineHeight: '28px' }}>快捷:</span>
          {PING_TARGETS.map((url, i) => (
            <button
              key={i}
              style={{
                ...s.btn,
                padding: '4px 10px',
                fontSize: 11,
                background: pingTarget === url ? 'rgba(97, 175, 239, 0.2)' : 'rgba(255,255,255,0.04)',
                color: pingTarget === url ? 'var(--accent, #61afef)' : 'var(--text-secondary, #9ca3af)',
              }}
              onClick={() => setPingTarget(url)}
            >
              {new URL(url).hostname}
            </button>
          ))}
        </div>
      </div>

      {pingResult && (
        <div style={s.card}>
          <div style={s.cardHead}>
            <Zap size={15} style={{ color: 'var(--accent, #61afef)' }} />
            <span>测试结果</span>
            {pingResult.running && (
              <span style={{ ...s.badge('#f59e0b'), marginLeft: 'auto' }}>
                <Loader2 size={10} style={{ animation: 'ndSpin 1s linear infinite' }} />
                测试中... ({pingResult.times.length}/10)
              </span>
            )}
          </div>
          <div style={s.grid4}>
            <div style={s.statBox}>
              <div style={s.statLabel}>平均延迟</div>
              <div style={{ ...s.statValue, fontSize: 16 }}>{pingResult.avg || '—'} <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>ms</span></div>
            </div>
            <div style={s.statBox}>
              <div style={s.statLabel}>最小延迟</div>
              <div style={{ ...s.statValue, fontSize: 16, color: '#22c55e' }}>{pingResult.min || '—'} <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>ms</span></div>
            </div>
            <div style={s.statBox}>
              <div style={s.statLabel}>最大延迟</div>
              <div style={{ ...s.statValue, fontSize: 16, color: '#ef4444' }}>{pingResult.max || '—'} <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>ms</span></div>
            </div>
            <div style={s.statBox}>
              <div style={s.statLabel}>丢包率</div>
              <div style={{
                ...s.statValue, fontSize: 16,
                color: pingResult.loss > 30 ? '#ef4444' : pingResult.loss > 10 ? '#f59e0b' : '#22c55e',
              }}>
                {pingResult.loss}% 
              </div>
            </div>
          </div>

          {pingResult.times.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--text-secondary, #6b7280)', marginBottom: 6 }}>
                延迟序列 (ms)
              </div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {pingResult.times.map((t, i) => (
                  <span key={i} style={{
                    ...s.badge(t < 100 ? '#22c55e' : t < 300 ? '#f59e0b' : '#ef4444'),
                    fontSize: 11,
                  }}>
                    {t}ms
                  </span>
                ))}
                {pingResult.running && (
                  <span style={s.badge('#6b7280')}>
                    <Loader2 size={10} style={{ animation: 'ndSpin 1s linear infinite' }} />
                  </span>
                )}
              </div>
            </div>
          )}

          {/* 延迟柱状图 */}
          {pingResult.times.length > 1 && (
            <div style={{ marginTop: 12 }}>
              <div style={{
                display: 'flex', alignItems: 'flex-end', gap: 2,
                height: 60, padding: 4,
                background: 'var(--window-bg, #0f0f1a)',
                borderRadius: 6,
              }}>
                {pingResult.times.map((t, i) => {
                  const maxT = Math.max(...pingResult.times, 1)
                  const h = Math.max(4, (t / maxT) * 52)
                  const color = t < 100 ? '#22c55e' : t < 300 ? '#f59e0b' : '#ef4444'
                  return (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        height: h,
                        background: `linear-gradient(180deg, ${color}, ${color}88)`,
                        borderRadius: '2px 2px 0 0',
                        minHeight: 2,
                      }}
                      title={`#${i + 1}: ${t}ms`}
                    />
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {pingHistory.length > 0 && (
        <div style={s.card}>
          <div style={s.cardHead}>
            <Activity size={15} style={{ color: 'var(--accent, #61afef)' }} />
            <span>历史平均延迟</span>
          </div>
          <div style={{
            display: 'flex', alignItems: 'flex-end', gap: 2,
            height: 50, padding: 4,
            background: 'var(--window-bg, #0f0f1a)',
            borderRadius: 6,
          }}>
            {pingHistory.map((v, i) => {
              const maxV = Math.max(...pingHistory, 1)
              const h = Math.max(4, (v / maxV) * 42)
              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: h,
                    background: 'var(--accent, #61afef)',
                    borderRadius: '2px 2px 0 0',
                    minHeight: 2,
                    opacity: 0.3 + (i / pingHistory.length) * 0.7,
                  }}
                  title={`${v}ms`}
                />
              )
            })}
          </div>
        </div>
      )}
    </div>
  )

  // ========== 渲染：速度测试 ==========
  const renderSpeedTest = () => (
    <div>
      <div style={s.card}>
        <div style={s.cardHead}>
          <Download size={15} style={{ color: 'var(--accent, #61afef)' }} />
          <span>网络速度测试</span>
          <span style={{ fontSize: 11, color: 'var(--text-secondary, #6b7280)', marginLeft: 'auto' }}>
            通过下载大文件测量实际带宽
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {speedResult?.running ? (
            <button
              style={{ ...s.btn, background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' }}
              onClick={stopSpeedTest}
            >
              <XCircle size={14} /> 停止测试
            </button>
          ) : (
            <button style={s.btn} onClick={runSpeedTest}>
              <Download size={14} /> 开始测试
            </button>
          )}
        </div>

        {speedResult && (
          <>
            <div style={{
              ...s.progressTrack,
              height: 8,
              marginBottom: 16,
            }}>
              <div style={s.progressBar(
                speedResult.progress,
                speedResult.running ? '#61afef' : '#22c55e'
              )} />
            </div>

            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{
                fontSize: 48,
                fontWeight: 800,
                fontFamily: "'Monaco', 'Menlo', monospace",
                color: speedResult.running ? 'var(--accent, #61afef)' : '#22c55e',
                lineHeight: 1,
              }}>
                {speedResult.downloadSpeed > 0 ? speedResult.downloadSpeed.toFixed(2) : '0.00'}
              </div>
              <div style={{
                fontSize: 16,
                color: 'var(--text-secondary, #6b7280)',
                marginTop: 4,
              }}>
                {speedResult.downloadSpeed >= 1 ? 'Mbps' : 'Kbps'}
              </div>
            </div>

            <div style={s.grid3}>
              <div style={s.statBox}>
                <div style={s.statLabel}>
                  <ArrowDown size={10} style={{ display: 'inline', verticalAlign: 'middle' }} /> 下载速度
                </div>
                <div style={{ ...s.statValue, fontSize: 15 }}>
                  {formatSpeed(speedResult.downloadSpeed)}
                </div>
              </div>
              <div style={s.statBox}>
                <div style={s.statLabel}>
                  <Download size={10} style={{ display: 'inline', verticalAlign: 'middle' }} /> 已下载
                </div>
                <div style={{ ...s.statValue, fontSize: 15 }}>
                  {formatBytes(speedResult.totalBytes)}
                </div>
              </div>
              <div style={s.statBox}>
                <div style={s.statLabel}>
                  <Clock size={10} style={{ display: 'inline', verticalAlign: 'middle' }} /> 耗时
                </div>
                <div style={{ ...s.statValue, fontSize: 15 }}>
                  {speedResult.duration.toFixed(1)}s
                </div>
              </div>
            </div>

            <div style={{
              marginTop: 12, padding: '8px 12px', borderRadius: 8,
              background: 'rgba(255, 170, 0, 0.06)',
              fontSize: 11, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <AlertTriangle size={12} />
              测速结果仅供参考，实际带宽受服务器距离、网络拥塞等因素影响。
              测试将下载约 10MB 数据。
            </div>
          </>
        )}

        {!speedResult && (
          <div style={s.emptyState}>
            <Download size={32} style={{ color: 'var(--text-secondary, #6b7280)' }} />
            <span>点击"开始测试"来测量您的网络下载速度</span>
            <span style={{ fontSize: 11, color: 'var(--text-secondary, #6b7280)' }}>
              测试将通过多个 CDN 源下载数据，持续约 10 秒
            </span>
          </div>
        )}
      </div>
    </div>
  )

  // ========== 主渲染 ==========
  return (
    <div style={s.root}>
      <style>{`
        @keyframes ndSpin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
        .nd-tab:hover { background: rgba(255,255,255,0.04) !important; }
        .nd-btn:hover:not(:disabled) { opacity: 0.85; transform: translateY(-1px); }
        .nd-input:focus { border-color: var(--accent, #61afef) !important; box-shadow: 0 0 0 2px rgba(97,175,239,0.15); }
        .nd-copy:hover { background: rgba(97,175,239,0.12) !important; border-color: rgba(97,175,239,0.3) !important; }
        select.nd-input option { background: var(--window-bg, #0f0f1a); color: var(--text-color, #e4e4e7); }
        .nd-content { scrollbar-width: thin; scrollbar-color: var(--window-border, #2a2a3e) transparent; }
        .nd-content::-webkit-scrollbar { width: 6px; }
        .nd-content::-webkit-scrollbar-track { background: transparent; }
        .nd-content::-webkit-scrollbar-thumb { background: var(--window-border, #2a2a3e); border-radius: 3px; }
      `}</style>

      {/* 头部 */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'rgba(97, 175, 239, 0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Wifi size={18} color="var(--accent, #61afef)" />
          </div>
          <span style={s.title}>网络诊断工具</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <span style={{
            ...s.badge(navigator.onLine ? '#22c55e' : '#ef4444'),
            fontSize: 11,
          }}>
            {navigator.onLine ? '在线' : '离线'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div style={s.tabs}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            className="nd-tab"
            style={{
              ...s.tab,
              ...(activeTab === tab.id ? s.tabActive : {}),
            }}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* 内容 */}
      <div className="nd-content" style={s.content}>
        {activeTab === 'network' && renderNetworkInfo()}
        {activeTab === 'dns' && renderDNS()}
        {activeTab === 'port' && renderPortScan()}
        {activeTab === 'whois' && renderWHOIS()}
        {activeTab === 'ping' && renderPing()}
        {activeTab === 'speed' && renderSpeedTest()}
      </div>
    </div>
  )
}
