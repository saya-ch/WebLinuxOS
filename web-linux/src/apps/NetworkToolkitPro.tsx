import { useState, useCallback, useRef, useEffect } from 'react'
import {
  Globe, Wifi, Server, Zap, ArrowDownToLine, Search, RefreshCw, X,
  MapPin, Copy, Check, AlertTriangle,
  Activity, Database,
} from 'lucide-react'

// ==================== 类型定义 ====================
interface IpInfo {
  query: string
  country: string
  countryCode: string
  regionName: string
  city: string
  lat: number
  lon: number
  timezone: string
  isp: string
  org: string
  as: string
}

interface DnsRecord {
  type: number
  TTL: number
  data: string
  name: string
}

interface DnsResult {
  status: number
  Answer?: DnsRecord[]
  Authority?: DnsRecord[]
  rtt: number
  error?: string
}

interface HttpStatusResult {
  status: number
  statusText: string
  headers: Record<string, string>
  time: number
  url: string
  error?: string
}

interface PingResult {
  url: string
  times: number[]
  avg: number
  min: number
  max: number
  loss: number
}

interface SpeedTestResult {
  speed: number // bytes per second
  downloaded: number // bytes
  elapsed: number // ms
  error?: string
}

type ActiveTab = 'ip' | 'dns' | 'http' | 'ping' | 'speed'

const DNS_TYPE_MAP: Record<string, number> = {
  A: 1, AAAA: 28, CNAME: 5, MX: 15, NS: 2, TXT: 16, SOA: 6,
}
const TYPE_NAME_MAP: Record<number, string> = Object.fromEntries(
  Object.entries(DNS_TYPE_MAP).map(([k, v]) => [v, k])
)

const DNS_RECORD_TYPES = ['A', 'AAAA', 'CNAME', 'MX', 'NS', 'TXT', 'SOA']

// ==================== 样式常量 ====================
const styles = {
  container: {
    height: '100%',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: "'Noto Sans SC', 'JetBrains Mono', system-ui, sans-serif",
    background: 'linear-gradient(180deg, #070a13 0%, #0a0e1a 100%)',
    color: '#e2e8f0',
    fontSize: 13,
    overflow: 'hidden',
  } as React.CSSProperties,

  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    background: 'linear-gradient(90deg, rgba(124,108,240,0.1) 0%, rgba(124,108,240,0.03) 50%, transparent 100%)',
  } as React.CSSProperties,

  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #7c6cf0 0%, #5b4cd4 100%)',
    boxShadow: '0 8px 24px rgba(124,108,240,0.3), inset 0 1px 0 rgba(255,255,255,0.18)',
    flexShrink: 0,
  } as React.CSSProperties,

  tabBar: {
    display: 'flex',
    gap: 4,
    padding: '8px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    overflowX: 'auto',
  } as React.CSSProperties,

  tabActive: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 14px',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 500,
    color: 'white',
    background: 'linear-gradient(135deg, #7c6cf0, #5b4cd4)',
    border: 'none',
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
    transition: 'all 0.15s',
  } as React.CSSProperties,

  tabInactive: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 14px',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 500,
    color: 'rgba(255,255,255,0.45)',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid transparent',
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
    transition: 'all 0.15s',
  } as React.CSSProperties,

  scrollArea: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    padding: 20,
  } as React.CSSProperties,

  card: {
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.02)',
    overflow: 'hidden',
  } as React.CSSProperties,

  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  } as React.CSSProperties,

  cardIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, rgba(124,108,240,0.2), rgba(91,76,212,0.12))',
    flexShrink: 0,
  } as React.CSSProperties,

  input: {
    flex: 1,
    padding: '10px 14px',
    borderRadius: 10,
    fontSize: 13,
    fontFamily: "'JetBrains Mono', monospace",
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#e2e8f0',
    outline: 'none',
    transition: 'border-color 0.2s',
    minWidth: 0,
  } as React.CSSProperties,

  btn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 18px',
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 500,
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    background: 'linear-gradient(135deg, #7c6cf0, #5b4cd4)',
    boxShadow: '0 4px 14px rgba(124,108,240,0.25)',
    transition: 'all 0.15s',
    whiteSpace: 'nowrap' as const,
    flexShrink: 0,
  } as React.CSSProperties,

  btnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  } as React.CSSProperties,

  btnGhost: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 14px',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 500,
    color: 'rgba(255,255,255,0.6)',
    border: '1px solid rgba(255,255,255,0.1)',
    cursor: 'pointer',
    background: 'rgba(255,255,255,0.04)',
    transition: 'all 0.15s',
    whiteSpace: 'nowrap' as const,
    flexShrink: 0,
  } as React.CSSProperties,

  kvRow: {
    display: 'flex',
    alignItems: 'flex-start',
    padding: '8px 0',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
  } as React.CSSProperties,

  kvLabel: {
    width: 130,
    flexShrink: 0,
    fontSize: 11,
    fontWeight: 500,
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    paddingTop: 2,
  } as React.CSSProperties,

  kvValue: {
    flex: 1,
    fontSize: 12.5,
    fontFamily: "'JetBrains Mono', monospace",
    color: '#c7d2fe',
    wordBreak: 'break-all' as const,
    lineHeight: 1.6,
  } as React.CSSProperties,

  statusBadge: (ok: boolean) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '2px 8px',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 500,
    background: ok ? 'rgba(52,211,153,0.12)' : 'rgba(251,113,133,0.12)',
    color: ok ? '#34d399' : '#fb7185',
    border: `1px solid ${ok ? 'rgba(52,211,153,0.2)' : 'rgba(251,113,133,0.2)'}`,
  }) as React.CSSProperties,

  progressRing: (pct: number) => ({
    width: 52,
    height: 52,
    borderRadius: '50%',
    background: `conic-gradient(#7c6cf0 ${pct * 3.6}deg, rgba(255,255,255,0.06) 0deg)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative' as const,
  }) as React.CSSProperties,

  ringInner: {
    width: 42,
    height: 42,
    borderRadius: '50%',
    background: '#0a0e1a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 700,
    color: '#c7d2fe',
    fontFamily: "'JetBrains Mono', monospace",
  } as React.CSSProperties,

  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    textAlign: 'center' as const,
    color: 'rgba(255,255,255,0.3)',
  } as React.CSSProperties,

  codeBlock: {
    padding: 12,
    borderRadius: 8,
    fontSize: 11,
    fontFamily: "'JetBrains Mono', monospace",
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.06)',
    color: '#a5b4fc',
    lineHeight: 1.7,
    overflowX: 'auto' as const,
    whiteSpace: 'pre-wrap' as const,
    wordBreak: 'break-all' as const,
  } as React.CSSProperties,

  speedBar: {
    height: 8,
    borderRadius: 4,
    background: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  } as React.CSSProperties,

  speedFill: (pct: number) => ({
    height: '100%',
    borderRadius: 4,
    width: `${Math.min(100, pct)}%`,
    background: 'linear-gradient(90deg, #7c6cf0, #a78bfa)',
    transition: 'width 0.3s ease',
  }) as React.CSSProperties,
}

// ==================== 工具函数 ====================
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function formatSpeed(bps: number): string {
  return formatBytes(bps) + '/s'
}

function formatMs(ms: number): string {
  return ms < 1 ? '<1 ms' : ms < 10 ? ms.toFixed(1) + ' ms' : Math.round(ms) + ' ms'
}

// ==================== API 函数 ====================
async function queryIpInfo(abortSignal?: AbortSignal): Promise<IpInfo> {
  const res = await fetch('http://ip-api.com/json/?fields=query,country,countryCode,regionName,city,lat,lon,timezone,isp,org,as', {
    signal: abortSignal,
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  if (data.status === 'fail') throw new Error(data.message || 'IP 查询失败')
  return data as IpInfo
}

async function queryDns(domain: string, type: string, abortSignal?: AbortSignal): Promise<DnsResult> {
  const start = performance.now()
  const res = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=${DNS_TYPE_MAP[type] || 1}`, {
    headers: { Accept: 'application/dns-json' },
    signal: abortSignal,
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  return {
    status: data.Status ?? -1,
    Answer: data.Answer || [],
    Authority: data.Authority || [],
    rtt: performance.now() - start,
    error: data.Status !== 0 ? `RCODE: ${data.Status}` : undefined,
  }
}

async function queryHttpStatus(url: string, abortSignal?: AbortSignal): Promise<HttpStatusResult> {
  const start = performance.now()
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      mode: 'no-cors',
      redirect: 'follow',
      signal: abortSignal,
    })
    const time = performance.now() - start
    const headers: Record<string, string> = {}
    res.headers.forEach((v, k) => { headers[k] = v })
    // no-cors: status 可能是 0
    return {
      status: res.status || 0,
      statusText: res.type === 'opaque' ? 'opaque (跨域受限)' : res.statusText,
      headers,
      time,
      url,
    }
  } catch (e) {
    // 退回 no-cors mode 重试
    const res2 = await fetch(url, { mode: 'no-cors', redirect: 'follow', signal: abortSignal })
    const time = performance.now() - start
    return {
      status: 0,
      statusText: res2.type === 'opaque' ? 'opaque (跨域)' : res2.type,
      headers: {},
      time,
      url,
      error: e instanceof Error ? e.message : String(e),
    }
  }
}

async function measurePing(url: string, count: number, abortSignal?: AbortSignal): Promise<PingResult> {
  const times: number[] = []
  for (let i = 0; i < count; i++) {
    if (abortSignal?.aborted) throw new Error('已取消')
    const start = performance.now()
    try {
      await fetch(url, {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-store',
        signal: abortSignal,
      })
      times.push(performance.now() - start)
    } catch {
      // request failed - count as loss
    }
  }
  const sorted = [...times].sort((a, b) => a - b)
  const avg = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0
  return {
    url,
    times,
    avg,
    min: sorted[0] || 0,
    max: sorted[sorted.length - 1] || 0,
    loss: count - times.length,
  }
}

async function runSpeedTest(
  abortSignal?: AbortSignal,
  onProgress?: (downloaded: number, elapsed: number) => void,
): Promise<SpeedTestResult> {
  // 下载一个随机化的测试文件（Cloudflare/Google 提供的公开资源）
  const testUrls = [
    'https://speed.cloudflare.com/__down?bytes=10485760', // 10MB
    'https://proof.ovh.net/files/10Mb.dat',
    'http://speedtest.tele2.net/10MB.zip',
  ]

  let lastError: string | undefined
  for (const testUrl of testUrls) {
    if (abortSignal?.aborted) throw new Error('已取消')
    try {
      const start = performance.now()
      const res = await fetch(testUrl, {
        cache: 'no-store',
        signal: abortSignal,
      })
      if (!res.ok || !res.body) {
        lastError = `HTTP ${res.status}`
        continue
      }
      const reader = res.body.getReader()
      let downloaded = 0
      while (true) {
        if (abortSignal?.aborted) { reader.cancel(); throw new Error('已取消') }
        const { done, value } = await reader.read()
        if (done) break
        downloaded += value.byteLength
        const elapsed = performance.now() - start
        onProgress?.(downloaded, elapsed)
      }
      const elapsed = performance.now() - start
      return {
        speed: downloaded / (elapsed / 1000),
        downloaded,
        elapsed,
      }
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') throw e
      lastError = e instanceof Error ? e.message : String(e)
    }
  }
  throw new Error(lastError || '所有测速节点不可用')
}

// ==================== 主组件 ====================
export default function NetworkToolkitPro() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('ip')
  const [copied, setCopied] = useState<string | null>(null)

  // IP 信息
  const [ipLoading, setIpLoading] = useState(false)
  const [ipInfo, setIpInfo] = useState<IpInfo | null>(null)
  const [ipError, setIpError] = useState<string | null>(null)

  // DNS 查询
  const [dnsDomain, setDnsDomain] = useState('github.com')
  const [dnsType, setDnsType] = useState('A')
  const [dnsLoading, setDnsLoading] = useState(false)
  const [dnsResult, setDnsResult] = useState<DnsResult | null>(null)
  const [dnsError, setDnsError] = useState<string | null>(null)

  // HTTP 状态
  const [httpUrl, setHttpUrl] = useState('https://github.com')
  const [httpLoading, setHttpLoading] = useState(false)
  const [httpResult, setHttpResult] = useState<HttpStatusResult | null>(null)
  const [httpError, setHttpError] = useState<string | null>(null)

  // Ping
  const [pingUrl, setPingUrl] = useState('https://github.com')
  const [pingCount, setPingCount] = useState(5)
  const [pingLoading, setPingLoading] = useState(false)
  const [pingResult, setPingResult] = useState<PingResult | null>(null)
  const [pingError, setPingError] = useState<string | null>(null)
  const [pingProgress, setPingProgress] = useState(0)

  // Speed test
  const [speedLoading, setSpeedLoading] = useState(false)
  const [speedResult, setSpeedResult] = useState<SpeedTestResult | null>(null)
  const [speedError, setSpeedError] = useState<string | null>(null)
  const [speedProgress, setSpeedProgress] = useState({ downloaded: 0, elapsed: 0 })

  // Abort controllers
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    return () => { abortRef.current?.abort() }
  }, [])

  const cancelAll = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = new AbortController()
    setIpLoading(false)
    setDnsLoading(false)
    setHttpLoading(false)
    setPingLoading(false)
    setSpeedLoading(false)
  }, [])

  const copyToClipboard = useCallback((text: string, key: string) => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(key)
      setTimeout(() => setCopied(null), 1500)
    }).catch(() => {})
  }, [])

  // ============ IP 查询 ============
  const handleIpQuery = useCallback(async () => {
    cancelAll()
    const controller = new AbortController()
    abortRef.current = controller
    setIpLoading(true)
    setIpError(null)
    setIpInfo(null)
    try {
      const info = await queryIpInfo(controller.signal)
      setIpInfo(info)
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return
      setIpError(e instanceof Error ? e.message : '查询失败')
    } finally {
      setIpLoading(false)
    }
  }, [cancelAll])

  // ============ DNS 查询 ============
  const handleDnsQuery = useCallback(async () => {
    if (!dnsDomain.trim()) return
    cancelAll()
    const controller = new AbortController()
    abortRef.current = controller
    setDnsLoading(true)
    setDnsError(null)
    setDnsResult(null)
    try {
      const result = await queryDns(dnsDomain.trim(), dnsType, controller.signal)
      setDnsResult(result)
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return
      setDnsError(e instanceof Error ? e.message : 'DNS 查询失败')
    } finally {
      setDnsLoading(false)
    }
  }, [dnsDomain, dnsType, cancelAll])

  // ============ HTTP 查询 ============
  const handleHttpQuery = useCallback(async () => {
    let url = httpUrl.trim()
    if (!url) return
    if (!/^https?:\/\//.test(url)) url = 'https://' + url
    cancelAll()
    const controller = new AbortController()
    abortRef.current = controller
    setHttpLoading(true)
    setHttpError(null)
    setHttpResult(null)
    try {
      const result = await queryHttpStatus(url, controller.signal)
      setHttpResult(result)
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return
      setHttpError(e instanceof Error ? e.message : '请求失败')
    } finally {
      setHttpLoading(false)
    }
  }, [httpUrl, cancelAll])

  // ============ Ping ============
  const handlePing = useCallback(async () => {
    let url = pingUrl.trim()
    if (!url) return
    if (!/^https?:\/\//.test(url)) url = 'https://' + url
    cancelAll()
    const controller = new AbortController()
    abortRef.current = controller
    setPingLoading(true)
    setPingError(null)
    setPingResult(null)
    setPingProgress(0)
    try {
      // 模拟进度
      const progressInterval = setInterval(() => {
        setPingProgress(prev => Math.min(prev + (100 / pingCount) * 0.8, 95))
      }, 300)

      const result = await measurePing(url, pingCount, controller.signal)
      clearInterval(progressInterval)
      setPingProgress(100)
      setPingResult(result)
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return
      setPingError(e instanceof Error ? e.message : 'Ping 失败')
    } finally {
      setPingLoading(false)
    }
  }, [pingUrl, pingCount, cancelAll])

  // ============ Speed Test ============
  const handleSpeedTest = useCallback(async () => {
    cancelAll()
    const controller = new AbortController()
    abortRef.current = controller
    setSpeedLoading(true)
    setSpeedError(null)
    setSpeedResult(null)
    setSpeedProgress({ downloaded: 0, elapsed: 0 })
    try {
      const result = await runSpeedTest(
        controller.signal,
        (downloaded, elapsed) => setSpeedProgress({ downloaded, elapsed }),
      )
      setSpeedResult(result)
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return
      setSpeedError(e instanceof Error ? e.message : '测速失败')
    } finally {
      setSpeedLoading(false)
    }
  }, [cancelAll])

  // ============ Tab 配置 ============
  const tabs: { id: ActiveTab; label: string; Icon: typeof Globe }[] = [
    { id: 'ip', label: 'IP 信息', Icon: MapPin },
    { id: 'dns', label: 'DNS 解析', Icon: Database },
    { id: 'http', label: 'HTTP 状态', Icon: Server },
    { id: 'ping', label: 'Ping 延迟', Icon: Activity },
    { id: 'speed', label: '速度测试', Icon: Zap },
  ]

  // ==================== 渲染 ====================
  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.iconBox}>
          <Wifi width={18} height={18} color="white" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 600, letterSpacing: '-0.01em', fontSize: 15 }}>
              Network Toolkit Pro
            </span>
            <span style={{
              fontSize: 10, padding: '2px 8px', borderRadius: 6,
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.4)',
            }}>
              网络诊断工具箱
            </span>
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
            IP 查询 · DNS 解析 · HTTP 状态码 · Ping 延迟 · 网络测速
          </div>
        </div>
        {activeTab && (ipLoading || dnsLoading || httpLoading || pingLoading || speedLoading) && (
          <button
            onClick={cancelAll}
            style={{ ...styles.btnGhost, color: '#fb7185', borderColor: 'rgba(251,113,133,0.3)' }}
          >
            <X width={12} height={12} /> 取消
          </button>
        )}
      </div>

      {/* Tab Bar */}
      <div style={styles.tabBar}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={activeTab === t.id ? styles.tabActive : styles.tabInactive}
          >
            <t.Icon width={13} height={13} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={styles.scrollArea}>

        {/* ===== IP 信息 ===== */}
        {activeTab === 'ip' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.cardIcon}>
                  <MapPin width={15} height={15} color="#c7d2fe" />
                </div>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#e2e8f0' }}>
                  IP 地址归属地查询
                </span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginLeft: 'auto' }}>
                  ip-api.com
                </span>
              </div>
              <div style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  <button
                    onClick={handleIpQuery}
                    disabled={ipLoading}
                    style={{ ...styles.btn, ...(ipLoading ? styles.btnDisabled : {}) }}
                  >
                    {ipLoading ? (
                      <RefreshCw width={14} height={14} style={{ animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <Search width={14} height={14} />
                    )}
                    查询我的 IP
                  </button>
                </div>

                {ipError && (
                  <div style={{
                    padding: '10px 14px', borderRadius: 8, marginBottom: 12,
                    fontSize: 12, color: '#fb7185',
                    background: 'rgba(251,113,133,0.08)', border: '1px solid rgba(251,113,133,0.15)',
                  }}>
                    <AlertTriangle width={12} height={12} style={{ display: 'inline', verticalAlign: -2, marginRight: 6 }} />
                    {ipError}
                  </div>
                )}

                {ipLoading && !ipInfo && (
                  <div style={{ padding: 20, textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>
                    正在查询 IP 信息…
                  </div>
                )}

                {ipInfo && (
                  <div style={styles.codeBlock}>
                    {[
                      ['IP 地址', ipInfo.query],
                      ['国家', `${ipInfo.country} (${ipInfo.countryCode})`],
                      ['地区', ipInfo.regionName],
                      ['城市', ipInfo.city],
                      ['纬度', String(ipInfo.lat)],
                      ['经度', String(ipInfo.lon)],
                      ['时区', ipInfo.timezone],
                      ['ISP', ipInfo.isp],
                      ['组织', ipInfo.org],
                      ['AS', ipInfo.as],
                    ].map(([label, value]) => (
                      <div key={label} style={{ display: 'flex', gap: 12, padding: '3px 0' }}>
                        <span style={{ color: 'rgba(255,255,255,0.35)', width: 50, flexShrink: 0 }}>{label}</span>
                        <span style={{ color: '#c7d2fe' }}>{value || '—'}</span>
                        {label === 'IP 地址' && value && (
                          <button
                            onClick={() => copyToClipboard(value, 'ip')}
                            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: 2 }}
                            title="复制"
                          >
                            {copied === 'ip' ? <Check width={12} height={12} color="#34d399" /> : <Copy width={12} height={12} />}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===== DNS 解析 ===== */}
        {activeTab === 'dns' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.cardIcon}>
                  <Database width={15} height={15} color="#c7d2fe" />
                </div>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#e2e8f0' }}>
                  DNS 解析查询
                </span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginLeft: 'auto' }}>
                  Google DoH
                </span>
              </div>
              <div style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                  <input
                    value={dnsDomain}
                    onChange={e => setDnsDomain(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleDnsQuery() }}
                    placeholder="输入域名，如 github.com"
                    style={styles.input}
                  />
                  <select
                    value={dnsType}
                    onChange={e => setDnsType(e.target.value)}
                    style={{
                      ...styles.input,
                      flex: 'none',
                      width: 100,
                      cursor: 'pointer',
                      background: 'rgba(255,255,255,0.03)',
                    }}
                  >
                    {DNS_RECORD_TYPES.map(t => (
                      <option key={t} value={t} style={{ background: '#1a1a2e', color: '#e2e8f0' }}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleDnsQuery}
                    disabled={dnsLoading}
                    style={{ ...styles.btn, ...(dnsLoading ? styles.btnDisabled : {}) }}
                  >
                    {dnsLoading ? (
                      <RefreshCw width={14} height={14} style={{ animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <Search width={14} height={14} />
                    )}
                    查询
                  </button>
                </div>

                {/* 快捷域名 */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                  {['github.com', 'google.com', 'baidu.com', 'cloudflare.com', 'example.com'].map(d => (
                    <button
                      key={d}
                      onClick={() => setDnsDomain(d)}
                      style={{
                        ...styles.btnGhost,
                        fontSize: 11,
                        padding: '3px 10px',
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {d}
                    </button>
                  ))}
                </div>

                {dnsError && (
                  <div style={{
                    padding: '10px 14px', borderRadius: 8, marginBottom: 12,
                    fontSize: 12, color: '#fb7185',
                    background: 'rgba(251,113,133,0.08)', border: '1px solid rgba(251,113,133,0.15)',
                  }}>
                    <AlertTriangle width={12} height={12} style={{ display: 'inline', verticalAlign: -2, marginRight: 6 }} />
                    {dnsError}
                  </div>
                )}

                {dnsResult && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                      <span style={styles.statusBadge(dnsResult.status === 0)}>
                        {dnsResult.status === 0 ? '✓ 解析成功' : `✗ RCODE ${dnsResult.status}`}
                      </span>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                        {formatMs(dnsResult.rtt)} · {dnsResult.Answer?.length || 0} 条记录
                      </span>
                    </div>

                    {dnsResult.Answer && dnsResult.Answer.length > 0 && (
                      <div style={styles.codeBlock}>
                        {dnsResult.Answer.map((a, i) => (
                          <div key={i} style={{ display: 'flex', gap: 8, padding: '2px 0' }}>
                            <span style={{ color: 'rgba(255,255,255,0.35)', width: 40, flexShrink: 0 }}>
                              {TYPE_NAME_MAP[a.type] || `T${a.type}`}
                            </span>
                            <span style={{ color: 'rgba(255,255,255,0.3)', width: 60, textAlign: 'right', flexShrink: 0 }}>
                              TTL {a.TTL}
                            </span>
                            <span style={{ color: '#a78bfa' }}>{a.name}</span>
                            <span style={{ color: 'rgba(255,255,255,0.2)', margin: '0 2px' }}>→</span>
                            <span style={{ color: '#34d399' }}>{a.data}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {dnsResult.Authority && dnsResult.Authority.length > 0 && (
                      <div style={{ marginTop: 8 }}>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>
                          权威记录 (Authority)
                        </div>
                        <div style={styles.codeBlock}>
                          {dnsResult.Authority.map((a, i) => (
                            <div key={i} style={{ display: 'flex', gap: 8, padding: '2px 0' }}>
                              <span style={{ color: 'rgba(255,255,255,0.35)', width: 40, flexShrink: 0 }}>
                                {TYPE_NAME_MAP[a.type] || `T${a.type}`}
                              </span>
                              <span style={{ color: 'rgba(255,255,255,0.3)', width: 60, textAlign: 'right', flexShrink: 0 }}>
                                TTL {a.TTL}
                              </span>
                              <span style={{ color: '#fbbf24' }}>{a.data}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {dnsResult.status === 0 && (!dnsResult.Answer || dnsResult.Answer.length === 0) && (
                      <div style={{ padding: 12, fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
                        未找到 {dnsType} 类型的 DNS 记录
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===== HTTP 状态 ===== */}
        {activeTab === 'http' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.cardIcon}>
                  <Server width={15} height={15} color="#c7d2fe" />
                </div>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#e2e8f0' }}>
                  HTTP 状态码查询
                </span>
              </div>
              <div style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <input
                    value={httpUrl}
                    onChange={e => setHttpUrl(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleHttpQuery() }}
                    placeholder="输入 URL，如 https://github.com"
                    style={styles.input}
                  />
                  <button
                    onClick={handleHttpQuery}
                    disabled={httpLoading}
                    style={{ ...styles.btn, ...(httpLoading ? styles.btnDisabled : {}) }}
                  >
                    {httpLoading ? (
                      <RefreshCw width={14} height={14} style={{ animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <Search width={14} height={14} />
                    )}
                    查询
                  </button>
                </div>

                {httpError && (
                  <div style={{
                    padding: '10px 14px', borderRadius: 8, marginBottom: 12,
                    fontSize: 12, color: '#fbbf24',
                    background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.15)',
                  }}>
                    <AlertTriangle width={12} height={12} style={{ display: 'inline', verticalAlign: -2, marginRight: 6 }} />
                    {httpError}（跨域 CORS 可能限制了响应头读取）
                  </div>
                )}

                {httpResult && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                      <span style={styles.statusBadge(httpResult.status >= 200 && httpResult.status < 400)}>
                        HTTP {httpResult.status || '?'} {httpResult.statusText}
                      </span>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                        响应时间: {formatMs(httpResult.time)}
                      </span>
                    </div>

                    {Object.keys(httpResult.headers).length > 0 ? (
                      <div style={styles.codeBlock}>
                        {Object.entries(httpResult.headers).map(([key, val]) => (
                          <div key={key} style={{ padding: '2px 0' }}>
                            <span style={{ color: '#a78bfa' }}>{key}</span>
                            <span style={{ color: 'rgba(255,255,255,0.2)' }}>: </span>
                            <span style={{ color: '#34d399' }}>{val}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{
                        padding: 16, borderRadius: 8, fontSize: 12, color: 'rgba(255,255,255,0.3)',
                        background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)',
                        textAlign: 'center',
                      }}>
                        跨域限制导致无法读取响应头。可尝试查询允许 CORS 的站点，或使用 curl -I 命令在服务器端查看。
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===== Ping 延迟 ===== */}
        {activeTab === 'ping' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.cardIcon}>
                  <Activity width={15} height={15} color="#c7d2fe" />
                </div>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#e2e8f0' }}>
                  Ping 延迟模拟
                </span>
              </div>
              <div style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                  <input
                    value={pingUrl}
                    onChange={e => setPingUrl(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handlePing() }}
                    placeholder="输入目标 URL"
                    style={{ ...styles.input, flex: 2 }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>次数:</span>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={pingCount}
                      onChange={e => setPingCount(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                      style={{ ...styles.input, width: 60, textAlign: 'center', flex: 'none' }}
                    />
                  </div>
                  <button
                    onClick={handlePing}
                    disabled={pingLoading}
                    style={{ ...styles.btn, ...(pingLoading ? styles.btnDisabled : {}) }}
                  >
                    {pingLoading ? (
                      <RefreshCw width={14} height={14} style={{ animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <Activity width={14} height={14} />
                    )}
                    开始 Ping
                  </button>
                </div>

                {/* Progress bar */}
                {pingLoading && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={styles.speedBar}>
                      <div style={styles.speedFill(pingProgress)} />
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4, textAlign: 'center' }}>
                      {Math.round(pingProgress)}% · 正在探测延迟…
                    </div>
                  </div>
                )}

                {pingError && (
                  <div style={{
                    padding: '10px 14px', borderRadius: 8, marginBottom: 12,
                    fontSize: 12, color: '#fb7185',
                    background: 'rgba(251,113,133,0.08)', border: '1px solid rgba(251,113,133,0.15)',
                  }}>
                    <AlertTriangle width={12} height={12} style={{ display: 'inline', verticalAlign: -2, marginRight: 6 }} />
                    {pingError}
                  </div>
                )}

                {pingResult && (
                  <div>
                    {/* Summary cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
                      {[
                        { label: '平均延迟', value: formatMs(pingResult.avg), color: '#c7d2fe' },
                        { label: '最小延迟', value: formatMs(pingResult.min), color: '#34d399' },
                        { label: '最大延迟', value: formatMs(pingResult.max), color: '#fbbf24' },
                        { label: '丢包率', value: `${Math.round((pingResult.loss / pingCount) * 100)}%`, color: pingResult.loss > 0 ? '#fb7185' : '#34d399' },
                      ].map(item => (
                        <div key={item.label} style={{
                          padding: '10px 12px', borderRadius: 10,
                          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                          textAlign: 'center',
                        }}>
                          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 4, textTransform: 'uppercase' }}>
                            {item.label}
                          </div>
                          <div style={{ fontSize: 16, fontWeight: 700, color: item.color, fontFamily: "'JetBrains Mono', monospace" }}>
                            {item.value}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Per-ping detail */}
                    <div style={styles.codeBlock}>
                      <div style={{ color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>
                        PING {pingResult.url} ({pingResult.times.length} packets)
                      </div>
                      {pingResult.times.map((t, i) => (
                        <div key={i} style={{ padding: '1px 0' }}>
                          <span style={{ color: 'rgba(255,255,255,0.35)' }}>#{i + 1}</span>
                          <span style={{ color: 'rgba(255,255,255,0.2)' }}> </span>
                          <span style={{ color: t < pingResult.avg * 0.8 ? '#34d399' : t > pingResult.avg * 1.2 ? '#fbbf24' : '#a78bfa' }}>
                            {formatMs(t)}
                          </span>
                        </div>
                      ))}
                      {pingResult.loss > 0 && (
                        <div style={{ color: '#fb7185', padding: '2px 0' }}>
                          ⚠ {pingResult.loss} 个请求超时
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===== 速度测试 ===== */}
        {activeTab === 'speed' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.cardIcon}>
                  <ArrowDownToLine width={15} height={15} color="#c7d2fe" />
                </div>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#e2e8f0' }}>
                  网络速度测试
                </span>
              </div>
              <div style={{ padding: '16px 20px' }}>
                <div style={{ marginBottom: 16 }}>
                  <button
                    onClick={handleSpeedTest}
                    disabled={speedLoading}
                    style={{ ...styles.btn, ...(speedLoading ? styles.btnDisabled : {}) }}
                  >
                    {speedLoading ? (
                      <RefreshCw width={14} height={14} style={{ animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <Zap width={14} height={14} />
                    )}
                    {speedLoading ? '测速中…' : '开始测速'}
                  </button>
                </div>

                {speedError && (
                  <div style={{
                    padding: '10px 14px', borderRadius: 8, marginBottom: 12,
                    fontSize: 12, color: '#fb7185',
                    background: 'rgba(251,113,133,0.08)', border: '1px solid rgba(251,113,133,0.15)',
                  }}>
                    <AlertTriangle width={12} height={12} style={{ display: 'inline', verticalAlign: -2, marginRight: 6 }} />
                    {speedError}
                  </div>
                )}

                {/* Live progress */}
                {speedLoading && speedProgress.elapsed > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>实时速度</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#c7d2fe', fontFamily: "'JetBrains Mono', monospace" }}>
                        {formatSpeed(speedProgress.downloaded / (speedProgress.elapsed / 1000))}
                      </span>
                    </div>
                    <div style={styles.speedBar}>
                      <div style={styles.speedFill(Math.min(100, (speedProgress.downloaded / (10 * 1024 * 1024)) * 100))} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                      <span>已下载 {formatBytes(speedProgress.downloaded)}</span>
                      <span>用时 {(speedProgress.elapsed / 1000).toFixed(1)}s</span>
                    </div>
                  </div>
                )}

                {/* Result */}
                {speedResult && (
                  <div>
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexDirection: 'column', padding: '24px 0', marginBottom: 16,
                    }}>
                      <div style={styles.progressRing(Math.min(100, speedResult.speed / (10 * 1024 * 1024) * 100))}>
                        <div style={styles.ringInner}>
                          {speedResult.speed >= 1024 * 1024
                            ? (speedResult.speed / (1024 * 1024)).toFixed(1)
                            : (speedResult.speed / 1024).toFixed(0)
                          }
                        </div>
                      </div>
                      <div style={{ marginTop: 12, fontSize: 22, fontWeight: 700, color: '#c7d2fe', fontFamily: "'JetBrains Mono', monospace" }}>
                        {formatSpeed(speedResult.speed)}
                      </div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
                        下载速度
                      </div>
                    </div>

                    <div style={styles.codeBlock}>
                      {[
                        ['下载速度', formatSpeed(speedResult.speed)],
                        ['已下载', formatBytes(speedResult.downloaded)],
                        ['用时', `${(speedResult.elapsed / 1000).toFixed(2)} 秒`],
                      ].map(([label, value]) => (
                        <div key={label} style={{ display: 'flex', gap: 12, padding: '3px 0' }}>
                          <span style={{ color: 'rgba(255,255,255,0.35)', width: 60, flexShrink: 0 }}>{label}</span>
                          <span style={{ color: '#c7d2fe' }}>{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!speedLoading && !speedResult && !speedError && (
                  <div style={styles.emptyState}>
                    <Zap width={40} height={40} style={{ opacity: 0.2, marginBottom: 12 }} />
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
                      点击「开始测速」测量当前网络下载速度
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 6 }}>
                      将下载约 10MB 测试数据计算速度
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom status bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '6px 16px', borderTop: '1px solid rgba(255,255,255,0.05)',
        fontSize: 11, color: 'rgba(255,255,255,0.3)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Globe width={11} height={11} />
            纯前端 · 无后端依赖
          </span>
        </div>
        <span>AbortController · try-catch 错误处理</span>
      </div>
    </div>
  )
}
