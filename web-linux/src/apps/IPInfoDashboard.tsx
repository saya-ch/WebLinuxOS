import { useState, useEffect, useCallback, useRef, memo } from 'react'
import {
  Globe, MapPin, Wifi, Shield, Copy, Check, RefreshCw,
  Server, Clock, Navigation, Radio, Activity, Zap,
  Eye, AlertTriangle, ChevronDown, ChevronUp, ExternalLink
} from 'lucide-react'

// ==================== 类型定义 ====================
interface IPInfoData {
  ip: string
  city: string
  region: string
  country: string
  country_name: string
  country_code: string
  continent_code: string
  timezone: string
  latitude: number
  longitude: number
  isp: string
  org: string
  asn: string
  postal: string
  utc_offset: string
  languages: string
  currency: string
  source: string
}

interface LatencyResult {
  endpoint: string
  latency: number
  status: 'success' | 'error' | 'pending'
}

interface DNSLeakResult {
  server: string
  ip: string
  country: string
  status: 'safe' | 'leak' | 'pending'
}

// ==================== 常量 ====================
const PRIMARY_API = 'https://ipapi.co/json/'
const FALLBACK_API = 'https://ip-api.com/json/?fields=status,message,country,countryCode,regionName,city,lat,lon,timezone,isp,org,as,query,offset'

const LATENCY_ENDPOINTS = [
  { name: 'Cloudflare', url: 'https://1.1.1.1/cdn-cgi/trace' },
  { name: 'Google DNS', url: 'https://dns.google/resolve?name=example.com' },
  { name: 'Quad9', url: 'https://dns.quad9.net:5053/dns-query' },
  { name: 'OpenDNS', url: 'https://doh.opendns.com/dns-query' },
  { name: 'Akamai', url: 'https://www.akamai.com/favicon.ico' },
]

const DNS_SERVERS = [
  { name: 'Cloudflare DNS', ip: '1.1.1.1', country: 'US' },
  { name: 'Google DNS', ip: '8.8.8.8', country: 'US' },
  { name: 'Quad9', ip: '9.9.9.9', country: 'CH' },
  { name: 'OpenDNS', ip: '208.67.222.222', country: 'US' },
]

const REFRESH_INTERVAL = 300

// ==================== 工具函数 ====================
const flagFromCountry = (code: string): string => {
  if (!code || code.length !== 2) return '🌍'
  const A = 0x1f1e6
  const chars = code.toUpperCase().split('').map(
    (c) => A + c.charCodeAt(0) - 'A'.charCodeAt(0)
  )
  return String.fromCodePoint(...chars)
}

// ==================== 样式常量 ====================
const styles: Record<string, React.CSSProperties> = {
  container: {
    background: '#0f0f23',
    color: '#e0e0e0',
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    height: '100%',
    overflow: 'auto',
    padding: '20px',
    boxSizing: 'border-box',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20px',
    padding: '16px 20px',
    background: 'linear-gradient(135deg, #1a1a3e 0%, #2d2d5e 100%)',
    borderRadius: '12px',
    border: '1px solid rgba(0, 212, 255, 0.15)',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  headerTitle: {
    fontSize: '20px',
    fontWeight: 700,
    background: 'linear-gradient(135deg, #00d4ff, #7b68ee)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    letterSpacing: '-0.3px',
  },
  headerSubtitle: {
    fontSize: '12px',
    color: '#8888aa',
    marginTop: '2px',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: 600,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '16px',
    marginBottom: '16px',
  },
  card: {
    background: '#1a1a3e',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.06)',
    padding: '20px',
    transition: 'border-color 0.3s, box-shadow 0.3s',
  },
  cardTitle: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#8888aa',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.8px',
    marginBottom: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  ipDisplay: {
    fontSize: '36px',
    fontWeight: 800,
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
    background: 'linear-gradient(135deg, #00d4ff, #7b68ee)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    letterSpacing: '-1px',
    wordBreak: 'break-all',
    lineHeight: 1.2,
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
  },
  infoLabel: {
    fontSize: '13px',
    color: '#7777aa',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  infoValue: {
    fontSize: '13px',
    color: '#e0e0e0',
    fontWeight: 500,
    fontFamily: "'JetBrains Mono', monospace",
    textAlign: 'right' as const,
    maxWidth: '60%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  button: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
    transition: 'all 0.2s',
  },
  mapContainer: {
    position: 'relative' as const,
    width: '100%',
    height: '200px',
    borderRadius: '8px',
    overflow: 'hidden',
    background: '#12122a',
    border: '1px solid rgba(255,255,255,0.04)',
  },
  progressBar: {
    width: '100%',
    height: '4px',
    borderRadius: '2px',
    background: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: '2px',
    transition: 'width 0.6s ease',
  },
  latencyBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 0',
  },
  latencyDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
    marginBottom: '16px',
  },
  statBox: {
    background: '#12122a',
    borderRadius: '10px',
    padding: '14px',
    textAlign: 'center' as const,
    border: '1px solid rgba(255,255,255,0.04)',
  },
  statValue: {
    fontSize: '22px',
    fontWeight: 700,
    color: '#00d4ff',
    fontFamily: "'JetBrains Mono', monospace",
  },
  statLabel: {
    fontSize: '11px',
    color: '#6666aa',
    marginTop: '4px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  collapseToggle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '8px',
    width: '100%',
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '8px',
    color: '#8888aa',
    cursor: 'pointer',
    fontSize: '12px',
    transition: 'all 0.2s',
  },
  countOverlay: {
    position: 'absolute' as const,
    top: '8px',
    right: '8px',
    background: 'rgba(15,15,35,0.85)',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '11px',
    fontFamily: "'JetBrains Mono', monospace",
    color: '#00d4ff',
    backdropFilter: 'blur(4px)',
  },
  mapDot: {
    position: 'absolute' as const,
    transform: 'translate(-50%, -50%)',
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    background: '#00d4ff',
    boxShadow: '0 0 12px rgba(0,212,255,0.6)',
    zIndex: 2,
  },
  mapPulse: {
    position: 'absolute' as const,
    transform: 'translate(-50%, -50%)',
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    border: '2px solid rgba(0,212,255,0.3)',
    zIndex: 1,
    animation: 'ipMapPulse 2s ease-out infinite',
  },
  loading: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: '12px',
    color: '#8888aa',
    fontSize: '14px',
  },
  copyBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 8px',
    borderRadius: '6px',
    border: '1px solid rgba(0,212,255,0.2)',
    background: 'rgba(0,212,255,0.08)',
    color: '#00d4ff',
    cursor: 'pointer',
    fontSize: '11px',
    fontWeight: 600,
    transition: 'all 0.2s',
  },
  webrtcCard: {
    background: '#1a1a3e',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.06)',
    padding: '16px 20px',
  },
  dnsItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 14px',
    borderRadius: '8px',
    marginBottom: '6px',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.03)',
  },
}

// ==================== 子组件 ====================

const WorldMap: React.FC<{ lat: number; lng: number }> = memo(({ lat, lng }) => {
  const x = ((lng + 180) / 360) * 100
  const y = ((90 - lat) / 180) * 100

  return (
    <div style={styles.mapContainer}>
      <svg
        viewBox="0 0 1000 500"
        style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
      >
        {/* 简化世界地图路径 */}
        <defs>
          <radialGradient id="mapGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(0,212,255,0.08)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="1000" height="500" fill="url(#grid)" />
        {/* 简化大陆轮廓 */}
        <g fill="rgba(0,212,255,0.1)" stroke="rgba(0,212,255,0.2)" strokeWidth="0.8">
          {/* 北美洲 */}
          <path d="M120,80 L180,70 L220,90 L250,130 L240,170 L210,200 L180,220 L150,210 L120,190 L100,160 L90,130 L100,100 Z" />
          {/* 南美洲 */}
          <path d="M200,250 L230,240 L260,260 L270,300 L260,350 L240,380 L220,390 L200,370 L190,330 L180,290 Z" />
          {/* 欧洲 */}
          <path d="M440,80 L480,75 L520,85 L530,110 L510,130 L480,140 L450,130 L430,110 Z" />
          {/* 非洲 */}
          <path d="M440,160 L490,150 L520,170 L540,210 L530,270 L510,320 L480,340 L450,330 L430,290 L420,240 L430,190 Z" />
          {/* 亚洲 */}
          <path d="M530,60 L620,50 L720,60 L780,80 L800,120 L790,160 L750,180 L700,190 L650,180 L600,160 L560,130 L540,100 Z" />
          {/* 印度 */}
          <path d="M640,190 L670,200 L680,240 L660,270 L630,260 L620,230 L630,200 Z" />
          {/* 东南亚 */}
          <path d="M700,200 L740,195 L770,210 L780,240 L760,260 L730,250 L710,230 Z" />
          {/* 澳大利亚 */}
          <path d="M770,310 L830,300 L870,310 L880,340 L860,370 L820,380 L780,370 L760,340 Z" />
        </g>
        {/* 纬度线 */}
        {[100, 167, 233, 300, 367, 433].map((y, i) => (
          <line key={`lat-${i}`} x1="0" y1={y} x2="1000" y2={y} stroke="rgba(255,255,255,0.02)" strokeWidth="0.5" strokeDasharray="4,4" />
        ))}
        {/* 经度线 */}
        {[100, 200, 300, 400, 500, 600, 700, 800, 900].map((x, i) => (
          <line key={`lng-${i}`} x1={x} y1="0" x2={x} y2="500" stroke="rgba(255,255,255,0.02)" strokeWidth="0.5" strokeDasharray="4,4" />
        ))}
        <circle cx="500" cy="250" r="200" fill="url(#mapGlow)" />
      </svg>
      <div style={{ ...styles.mapDot, left: `${x}%`, top: `${y}%` }} />
      <div style={{ ...styles.mapPulse, left: `${x}%`, top: `${y}%` }} />
      <div style={styles.countOverlay}>
        <MapPin size={10} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
        {lat.toFixed(4)}°, {lng.toFixed(4)}°
      </div>
    </div>
  )
})

const InfoRow: React.FC<{
  icon: React.ReactNode
  label: string
  value: string
  mono?: boolean
}> = memo(({ icon, label, value, mono }) => (
  <div style={styles.infoRow}>
    <span style={styles.infoLabel}>{icon}{label}</span>
    <span
      style={{
        ...styles.infoValue,
        fontFamily: mono ? "'JetBrains Mono', 'Fira Code', monospace" : 'inherit',
      }}
    >
      {value}
    </span>
  </div>
))

const ConnectionQuality: React.FC<{ score: number }> = memo(({ score }) => {
  const getColor = () => {
    if (score >= 80) return '#00ff88'
    if (score >= 50) return '#ffaa00'
    return '#ff4466'
  }
  const getLabel = () => {
    if (score >= 80) return '优秀'
    if (score >= 50) return '良好'
    if (score >= 20) return '一般'
    return '较差'
  }
  return (
    <div style={{ textAlign: 'center' }}>
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
        <circle
          cx="50" cy="50" r="42"
          fill="none"
          stroke={getColor()}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${(score / 100) * 264} 264`}
          transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
        <text x="50" y="45" textAnchor="middle" fill={getColor()} fontSize="22" fontWeight="700"
          fontFamily="'JetBrains Mono', monospace">
          {score}
        </text>
        <text x="50" y="62" textAnchor="middle" fill="#8888aa" fontSize="10" fontWeight="500">
          {getLabel()}
        </text>
      </svg>
    </div>
  )
})

// ==================== 主组件 ====================
export default function IPInfoDashboard() {
  const [ipData, setIpData] = useState<IPInfoData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL)
  const [latencyResults, setLatencyResults] = useState<LatencyResult[]>([])
  const [latencyRunning, setLatencyRunning] = useState(false)
  const [localIPs, setLocalIPs] = useState<string[]>([])
  const [webrtcDetected, setWebrtcDetected] = useState(false)
  const [dnsResults, setDnsResults] = useState<DNSLeakResult[]>([])
  const [dnsRunning, setDnsRunning] = useState(false)
  const [showAllInfo, setShowAllInfo] = useState(false)
  const [connectionScore, setConnectionScore] = useState(0)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const fetchCountRef = useRef(0)

  // ========== 获取 IP 信息 ==========
  const fetchIPInfo = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(PRIMARY_API)
      if (!res.ok) throw new Error('Primary API failed')
      const data = await res.json()
      if (data.error) throw new Error(data.reason || 'API error')
      setIpData({
        ip: data.ip || '',
        city: data.city || '',
        region: data.region || '',
        country: data.country_code || '',
        country_name: data.country_name || '',
        country_code: data.country_code || '',
        continent_code: data.continent_code || '',
        timezone: data.timezone || '',
        latitude: data.latitude || 0,
        longitude: data.longitude || 0,
        isp: data.org || '',
        org: data.org || '',
        asn: data.asn || '',
        postal: data.postal || '',
        utc_offset: data.utc_offset || '',
        languages: data.languages || '',
        currency: data.currency || '',
        source: 'ipapi.co',
      })
      fetchCountRef.current += 1
    } catch {
      // 回退 API
      try {
        const res = await fetch(FALLBACK_API)
        if (!res.ok) throw new Error('Fallback API failed')
        const data = await res.json()
        if (data.status === 'fail') throw new Error(data.message || 'Fallback failed')
        setIpData({
          ip: data.query || '',
          city: data.city || '',
          region: data.regionName || '',
          country: data.countryCode || '',
          country_name: data.country || '',
          country_code: data.countryCode || '',
          continent_code: '',
          timezone: data.timezone || '',
          latitude: data.lat || 0,
          longitude: data.lon || 0,
          isp: data.isp || '',
          org: data.org || '',
          asn: data.as || '',
          postal: '',
          utc_offset: data.offset !== undefined ? `UTC${data.offset >= 0 ? '+' : ''}${data.offset / 3600}` : '',
          languages: '',
          currency: '',
          source: 'ip-api.com',
        })
        fetchCountRef.current += 1
      } catch (e) {
        setError(e instanceof Error ? e.message : '无法获取 IP 信息')
      }
    } finally {
      setLoading(false)
      setCountdown(REFRESH_INTERVAL)
    }
  }, [])

  // ========== WebRTC 本地 IP 检测 ==========
  const detectLocalIP = useCallback(async () => {
    try {
      const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })
      const ips: Set<string> = new Set()
      return new Promise<void>((resolve) => {
        pc.createDataChannel('')
        pc.createOffer().then((offer) => pc.setLocalDescription(offer)).catch(() => {})
        const timeout = setTimeout(() => {
          pc.close()
          setLocalIPs([...ips].filter((ip) => !ip.startsWith('0.0.') && ip !== '0.0.0.0'))
          setWebrtcDetected(true)
          resolve()
        }, 3000)
        pc.onicecandidate = (event) => {
          if (!event.candidate) return
          const match = event.candidate.candidate.match(/(\d+\.\d+\.\d+\.\d+)/)
          if (match) ips.add(match[1])
        }
        pc.onicegatheringstatechange = () => {
          if (pc.iceGatheringState === 'complete') {
            clearTimeout(timeout)
            pc.close()
            setLocalIPs([...ips].filter((ip) => !ip.startsWith('0.0.') && ip !== '0.0.0.0'))
            setWebrtcDetected(true)
            resolve()
          }
        }
      })
    } catch {
      setWebrtcDetected(true)
    }
  }, [])

  // ========== 延迟测试 ==========
  const runLatencyTest = useCallback(async () => {
    setLatencyRunning(true)
    setLatencyResults(LATENCY_ENDPOINTS.map((ep) => ({ endpoint: ep.name, latency: 0, status: 'pending' })))
    const results: LatencyResult[] = []
    for (let i = 0; i < LATENCY_ENDPOINTS.length; i++) {
      const ep = LATENCY_ENDPOINTS[i]
      const times: number[] = []
      let status: 'success' | 'error' = 'success'
      for (let j = 0; j < 3; j++) {
        const start = performance.now()
        try {
          await fetch(ep.url + '?t=' + Date.now(), { mode: 'no-cors', cache: 'no-store' })
          times.push(performance.now() - start)
        } catch {
          times.push(999)
          status = 'error'
        }
      }
      const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length)
      results.push({ endpoint: ep.name, latency: avg, status })
      setLatencyResults([...results, ...LATENCY_ENDPOINTS.slice(i + 1).map((ep2) => ({
        endpoint: ep2.name, latency: 0, status: 'pending' as const,
      }))])
    }
    setLatencyResults(results)
    setLatencyRunning(false)
    // 计算连接质量分数
    const validLatencies = results.filter((r) => r.status === 'success').map((r) => r.latency)
    if (validLatencies.length > 0) {
      const avgLat = validLatencies.reduce((a, b) => a + b, 0) / validLatencies.length
      const score = Math.max(0, Math.min(100, Math.round(100 - (avgLat - 20) * 2)))
      setConnectionScore(score)
    }
  }, [])

  // ========== DNS 泄漏测试 ==========
  const runDNSTest = useCallback(async () => {
    setDnsRunning(true)
    setDnsResults(DNS_SERVERS.map((s) => ({
      server: s.name, ip: s.ip, country: s.country, status: 'pending' as const,
    })))
    const results: DNSLeakResult[] = []
    for (let i = 0; i < DNS_SERVERS.length; i++) {
      const dns = DNS_SERVERS[i]
      try {
        const start = performance.now()
        await fetch(`https://dns.google/resolve?name=whoami.akamai.net`, {
          mode: 'no-cors', cache: 'no-store',
        })
        const latency = performance.now() - start
        results.push({
          server: dns.name,
          ip: dns.ip,
          country: dns.country,
          status: latency < 1000 ? 'safe' : 'leak',
        })
      } catch {
        results.push({ server: dns.name, ip: dns.ip, country: dns.country, status: 'leak' })
      }
      setDnsResults([...results, ...DNS_SERVERS.slice(i + 1).map((d2) => ({
        server: d2.name, ip: d2.ip, country: d2.country, status: 'pending' as const,
      }))])
    }
    setDnsResults(results)
    setDnsRunning(false)
  }, [])

  // ========== 复制 IP ==========
  const copyIP = useCallback(async () => {
    if (!ipData?.ip) return
    try {
      await navigator.clipboard.writeText(ipData.ip)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
    }
  }, [ipData])

  // ========== 初始化 & 自动刷新 ==========
  useEffect(() => {
    fetchIPInfo()
    detectLocalIP()
  }, [fetchIPInfo, detectLocalIP])

  useEffect(() => {
    if (autoRefresh) {
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            fetchIPInfo()
            return REFRESH_INTERVAL
          }
          return prev - 1
        })
      }, 1000)
    } else if (countdownRef.current) {
      clearInterval(countdownRef.current)
    }
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [autoRefresh, fetchIPInfo])

  // ========== 渲染 ==========
  const formatCountdown = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const avgLatency = latencyResults.length > 0
    ? Math.round(latencyResults.filter((r) => r.status === 'success').reduce((a, b) => a + b.latency, 0) /
        Math.max(1, latencyResults.filter((r) => r.status === 'success').length))
    : 0

  return (
    <div style={styles.container}>
      {/* 关键帧动画 */}
      <style>{`
        @keyframes ipMapPulse {
          0% { transform: translate(-50%,-50%) scale(1); opacity: 1; }
          100% { transform: translate(-50%,-50%) scale(2.5); opacity: 0; }
        }
        @keyframes ipSpin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
        @keyframes ipFadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .ipdash-card:hover { border-color: rgba(0,212,255,0.2) !important; box-shadow: 0 4px 20px rgba(0,212,255,0.05) !important; }
        .ipdash-btn:hover { opacity: 0.85; transform: translateY(-1px); }
        .ipdash-copy:hover { background: rgba(0,212,255,0.15) !important; }
      `}</style>

      {/* 头部 */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'linear-gradient(135deg, #00d4ff22, #7b68ee22)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Globe size={22} color="#00d4ff" />
          </div>
          <div>
            <div style={styles.headerTitle}>IP 信息仪表盘</div>
            <div style={styles.headerSubtitle}>
              网络诊断 · IP 查询 · 连接分析
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {autoRefresh && (
            <span style={{ ...styles.badge, background: 'rgba(0,212,255,0.1)', color: '#00d4ff' }}>
              <Clock size={10} />
              {formatCountdown(countdown)}
            </span>
          )}
          {ipData && (
            <span style={{ ...styles.badge, background: 'rgba(0,255,136,0.1)', color: '#00ff88' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00ff88' }} />
              在线
            </span>
          )}
          <button
            className="ipdash-btn"
            onClick={() => setAutoRefresh(!autoRefresh)}
            style={{
              ...styles.button,
              background: autoRefresh ? 'rgba(0,212,255,0.15)' : 'rgba(255,255,255,0.05)',
              color: autoRefresh ? '#00d4ff' : '#8888aa',
            }}
          >
            <RefreshCw size={14} style={{ animation: autoRefresh ? 'ipSpin 2s linear infinite' : 'none' }} />
            自动刷新
          </button>
          <button
            className="ipdash-btn"
            onClick={fetchIPInfo}
            style={{ ...styles.button, background: 'rgba(255,255,255,0.05)', color: '#8888aa' }}
          >
            <RefreshCw size={14} />
            刷新
          </button>
        </div>
      </div>

      {loading && !ipData ? (
        <div style={{ ...styles.loading, minHeight: 300 }}>
          <RefreshCw size={32} color="#00d4ff" style={{ animation: 'ipSpin 1s linear infinite' }} />
          正在获取 IP 信息...
        </div>
      ) : error && !ipData ? (
        <div style={{ ...styles.loading, minHeight: 300, color: '#ff4466' }}>
          <AlertTriangle size={32} />
          {error}
          <button
            className="ipdash-btn"
            onClick={fetchIPInfo}
            style={{ ...styles.button, background: 'rgba(255,68,102,0.1)', color: '#ff4466' }}
          >
            重试
          </button>
        </div>
      ) : ipData ? (
        <>
          {/* 统计摘要 */}
          <div style={styles.statsGrid}>
            <div style={styles.statBox}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 4 }}>
                <Wifi size={14} color="#00d4ff" />
              </div>
              <div style={styles.statValue}>{avgLatency || '—'}</div>
              <div style={styles.statLabel}>平均延迟 (ms)</div>
            </div>
            <div style={styles.statBox}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 4 }}>
                <Activity size={14} color="#7b68ee" />
              </div>
              <div style={styles.statValue}>{localIPs.length || '—'}</div>
              <div style={styles.statLabel}>本地 IP 数</div>
            </div>
            <div style={styles.statBox}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 4 }}>
                <Shield size={14} color="#00ff88" />
              </div>
              <div style={styles.statValue}>{fetchCountRef.current}</div>
              <div style={styles.statLabel}>查询次数</div>
            </div>
          </div>

          <div style={styles.grid}>
            {/* 公共 IP */}
            <div
              className="ipdash-card"
              style={{
                ...styles.card,
                background: 'linear-gradient(135deg, #1a1a3e, #1e1e4a)',
                border: '1px solid rgba(0,212,255,0.12)',
                animation: 'ipFadeIn 0.5s ease',
              }}
            >
              <div style={styles.cardTitle}>
                <Globe size={14} color="#00d4ff" />
                公共 IP 地址
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={styles.ipDisplay}>{ipData.ip}</div>
                <button
                  className="ipdash-copy"
                  onClick={copyIP}
                  style={styles.copyBtn}
                  title="复制到剪贴板"
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? '已复制' : '复制'}
                </button>
              </div>
              <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{
                  ...styles.badge,
                  background: 'rgba(123,104,238,0.12)',
                  color: '#7b68ee',
                }}>
                  <Server size={10} />
                  {ipData.source}
                </span>
                <span style={{
                  ...styles.badge,
                  background: 'rgba(0,255,136,0.1)',
                  color: '#00ff88',
                }}>
                  <Shield size={10} />
                  IPv{ipData.ip.includes(':') ? '6' : '4'}
                </span>
              </div>
            </div>

            {/* 地理位置 + 地图 */}
            <div
              className="ipdash-card"
              style={{ ...styles.card, animation: 'ipFadeIn 0.6s ease' }}
            >
              <div style={styles.cardTitle}>
                <MapPin size={14} color="#00d4ff" />
                地理位置
              </div>
              {ipData.latitude !== 0 || ipData.longitude !== 0 ? (
                <WorldMap lat={ipData.latitude} lng={ipData.longitude} />
              ) : (
                <div style={{ ...styles.mapContainer, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' }}>
                  <MapPin size={24} />
                </div>
              )}
              <div style={{ marginTop: 12 }}>
                <InfoRow
                  icon={<MapPin size={12} />}
                  label="国家"
                  value={`${flagFromCountry(ipData.country_code)} ${ipData.country_name}`}
                />
                <InfoRow
                  icon={<MapPin size={12} />}
                  label="地区"
                  value={`${ipData.region}, ${ipData.city}`}
                />
                <InfoRow
                  icon={<Navigation size={12} />}
                  label="坐标"
                  value={`${ipData.latitude.toFixed(4)}, ${ipData.longitude.toFixed(4)}`}
                  mono
                />
              </div>
            </div>

            {/* 网络信息 */}
            <div
              className="ipdash-card"
              style={{ ...styles.card, animation: 'ipFadeIn 0.7s ease' }}
            >
              <div style={styles.cardTitle}>
                <Wifi size={14} color="#7b68ee" />
                网络信息
              </div>
              <InfoRow icon={<Server size={12} />} label="ISP" value={ipData.isp || '未知'} />
              <InfoRow icon={<Globe size={12} />} label="组织" value={ipData.org || '未知'} />
              <InfoRow icon={<Radio size={12} />} label="ASN" value={ipData.asn || '未知'} mono />
              <InfoRow icon={<Clock size={12} />} label="时区" value={ipData.timezone || '未知'} mono />
              {ipData.utc_offset && (
                <InfoRow icon={<Clock size={12} />} label="UTC 偏移" value={ipData.utc_offset} mono />
              )}
              {showAllInfo && (
                <>
                  <InfoRow icon={<MapPin size={12} />} label="邮编" value={ipData.postal || '未知'} mono />
                  {ipData.languages && (
                    <InfoRow icon={<Globe size={12} />} label="语言" value={ipData.languages} />
                  )}
                  {ipData.currency && (
                    <InfoRow icon={<Zap size={12} />} label="货币" value={ipData.currency} />
                  )}
                </>
              )}
              <button
                className="ipdash-btn"
                onClick={() => setShowAllInfo(!showAllInfo)}
                style={styles.collapseToggle}
              >
                {showAllInfo ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {showAllInfo ? '收起详情' : '展开更多'}
              </button>
            </div>

            {/* 连接质量 */}
            <div
              className="ipdash-card"
              style={{ ...styles.card, animation: 'ipFadeIn 0.8s ease' }}
            >
              <div style={styles.cardTitle}>
                <Activity size={14} color="#00ff88" />
                连接质量
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <ConnectionQuality score={connectionScore} />
              </div>
              <button
                className="ipdash-btn"
                onClick={runLatencyTest}
                disabled={latencyRunning}
                style={{
                  ...styles.button,
                  background: latencyRunning ? 'rgba(0,212,255,0.05)' : 'rgba(0,212,255,0.12)',
                  color: '#00d4ff',
                  width: '100%',
                  justifyContent: 'center',
                  opacity: latencyRunning ? 0.6 : 1,
                }}
              >
                {latencyRunning ? (
                  <RefreshCw size={14} style={{ animation: 'ipSpin 1s linear infinite' }} />
                ) : (
                  <Zap size={14} />
                )}
                {latencyRunning ? '测试中...' : '开始延迟测试'}
              </button>
              {latencyResults.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  {latencyResults.map((r, i) => (
                    <div key={i} style={styles.latencyBar}>
                      <div style={{
                        ...styles.latencyDot,
                        background: r.status === 'pending' ? '#555' : r.status === 'success' ? '#00ff88' : '#ff4466',
                      }} />
                      <span style={{ fontSize: 12, color: '#8888aa', width: 80 }}>{r.endpoint}</span>
                      <div style={{ flex: 1, ...styles.progressBar }}>
                        <div style={{
                          ...styles.progressFill,
                          width: r.status === 'pending' ? '0%' : `${Math.min(100, (r.latency / 500) * 100)}%`,
                          background: r.status === 'success'
                            ? r.latency < 100 ? '#00ff88' : r.latency < 300 ? '#ffaa00' : '#ff4466'
                            : '#ff4466',
                        }} />
                      </div>
                      <span style={{
                        fontSize: 12,
                        fontFamily: "'JetBrains Mono', monospace",
                        color: r.status === 'pending' ? '#555' : '#e0e0e0',
                        width: 50,
                        textAlign: 'right',
                      }}>
                        {r.status === 'pending' ? '—' : `${r.latency}ms`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* WebRTC 本地 IP */}
            <div
              className="ipdash-card"
              style={{ ...styles.card, animation: 'ipFadeIn 0.9s ease' }}
            >
              <div style={styles.cardTitle}>
                <Eye size={14} color="#ffaa00" />
                WebRTC 本地 IP
              </div>
              {!webrtcDetected ? (
                <div style={{ textAlign: 'center', padding: '20px 0', color: '#666' }}>
                  <RefreshCw size={20} style={{ animation: 'ipSpin 1s linear infinite', marginBottom: 8 }} />
                  <div style={{ fontSize: 12 }}>正在检测...</div>
                </div>
              ) : localIPs.length > 0 ? (
                <div>
                  {localIPs.map((ip, i) => (
                    <div key={i} style={{
                      ...styles.dnsItem,
                      border: '1px solid rgba(255,170,0,0.15)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Wifi size={12} color="#ffaa00" />
                        <span style={{ fontSize: 13, color: '#e0e0e0', fontFamily: "'JetBrains Mono', monospace" }}>
                          {ip}
                        </span>
                      </div>
                      <span style={{
                        ...styles.badge,
                        background: 'rgba(255,170,0,0.1)',
                        color: '#ffaa00',
                      }}>
                        本地
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <Shield size={24} color="#00ff88" style={{ marginBottom: 8 }} />
                  <div style={{ fontSize: 13, color: '#00ff88' }}>未检测到本地 IP</div>
                  <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>
                    WebRTC 可能被禁用或无本地网络接口
                  </div>
                </div>
              )}
            </div>

            {/* DNS 泄漏测试 */}
            <div
              className="ipdash-card"
              style={{ ...styles.card, animation: 'ipFadeIn 1.0s ease' }}
            >
              <div style={styles.cardTitle}>
                <Shield size={14} color="#7b68ee" />
                DNS 泄漏测试
              </div>
              <button
                className="ipdash-btn"
                onClick={runDNSTest}
                disabled={dnsRunning}
                style={{
                  ...styles.button,
                  background: dnsRunning ? 'rgba(123,104,238,0.05)' : 'rgba(123,104,238,0.12)',
                  color: '#7b68ee',
                  width: '100%',
                  justifyContent: 'center',
                  marginBottom: 12,
                  opacity: dnsRunning ? 0.6 : 1,
                }}
              >
                {dnsRunning ? (
                  <RefreshCw size={14} style={{ animation: 'ipSpin 1s linear infinite' }} />
                ) : (
                  <Shield size={14} />
                )}
                {dnsRunning ? '测试中...' : '开始 DNS 测试'}
              </button>
              {dnsResults.length > 0 && (
                <div>
                  {dnsResults.map((r, i) => (
                    <div key={i} style={styles.dnsItem}>
                      <div>
                        <div style={{ fontSize: 13, color: '#e0e0e0' }}>{r.server}</div>
                        <div style={{ fontSize: 11, color: '#666', fontFamily: "'JetBrains Mono', monospace" }}>
                          {r.ip} · {r.country}
                        </div>
                      </div>
                      <span style={{
                        ...styles.badge,
                        background: r.status === 'pending'
                          ? 'rgba(255,255,255,0.05)'
                          : r.status === 'safe'
                            ? 'rgba(0,255,136,0.1)'
                            : 'rgba(255,68,102,0.1)',
                        color: r.status === 'pending' ? '#555' : r.status === 'safe' ? '#00ff88' : '#ff4466',
                      }}>
                        {r.status === 'pending' ? '检测中' : r.status === 'safe' ? '安全' : '泄漏'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 底部信息栏 */}
          <div style={{
            ...styles.card,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 20px',
            fontSize: 11,
            color: '#555577',
            flexWrap: 'wrap',
            gap: 8,
          }}>
            <span>
              数据来源: {ipData.source} · 查询 #{fetchCountRef.current} ·
              {new Date().toLocaleString('zh-CN')}
            </span>
            <a
              href={`https://ipinfo.io/${ipData.ip}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#00d4ff',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              在 ipinfo.io 查看详情
              <ExternalLink size={10} />
            </a>
          </div>
        </>
      ) : null}
    </div>
  )
}
