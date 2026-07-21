import { useState, useEffect, useCallback, memo } from 'react'
import {
  Globe,
  Search,
  RefreshCw,
  MapPin,
  Server,
  Link2,
  Zap,
  Activity,
  Wifi,
  WifiOff,
  Download,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  ChevronRight,
  Clock,
  Copy,
  Check,
  Shield,
  Lock,
  Unlock,
  Hash,
  Layers,
  BarChart3,
  Signal,
  Database,
  Terminal,
} from 'lucide-react'

// ==================== 类型定义 ====================
type ToolTab = 'ip-info' | 'dns-lookup' | 'url-codec' | 'network-status' | 'http-status' | 'port-scanner'

interface IPInfo {
  ip: string
  version?: string
  city?: string
  region?: string
  country_name?: string
  country_code?: string
  country_capital?: string
  postal?: string
  latitude?: number
  longitude?: number
  timezone?: string
  currency?: string
  currency_symbol?: string
  asn?: string
  org?: string
  isp?: string
  languages?: string
  country_population?: number
  country_area?: number
  utc_offset?: string
}

interface DNSRecord {
  name: string
  type: number
  typeName: string
  TTL: number
  data: string
}

interface HTTPStatusInfo {
  name: string
  description: string
  category: string
  color: string
}

interface PortInfo {
  port: number
  protocol: string
  service: string
  description: string
  status: 'open' | 'closed' | 'filtered' | 'unknown'
  common: boolean
}

interface HistoryItem {
  id: string
  type: string
  query: string
  timestamp: number
}

// ==================== 常量 ====================
const STORAGE_KEY = 'weblinux-networktoolkitpro-history'
const HISTORY_MAX = 20

const HTTP_STATUS_CODES: Record<number, HTTPStatusInfo> = {
  100: { name: 'Continue', description: '请求者应当继续提出请求', category: '信息响应 (100–199)', color: '#3b82f6' },
  101: { name: 'Switching Protocols', description: '请求者已要求服务器切换协议', category: '信息响应 (100–199)', color: '#3b82f6' },
  102: { name: 'Processing', description: '服务器已收到并正在处理请求', category: '信息响应 (100–199)', color: '#3b82f6' },
  103: { name: 'Early Hints', description: '用于在最终响应之前返回一些响应头', category: '信息响应 (100–199)', color: '#3b82f6' },
  200: { name: 'OK', description: '请求成功', category: '成功响应 (200–299)', color: '#22c55e' },
  201: { name: 'Created', description: '请求已被成功处理，并创建了新的资源', category: '成功响应 (200–299)', color: '#22c55e' },
  202: { name: 'Accepted', description: '请求已被接受，但尚未处理', category: '成功响应 (200–299)', color: '#22c55e' },
  203: { name: 'Non-Authoritative Information', description: '返回的元信息不是来自原始服务器', category: '成功响应 (200–299)', color: '#22c55e' },
  204: { name: 'No Content', description: '请求成功处理，但没有返回任何内容', category: '成功响应 (200–299)', color: '#22c55e' },
  205: { name: 'Reset Content', description: '请求者应当重置文档视图', category: '成功响应 (200–299)', color: '#22c55e' },
  206: { name: 'Partial Content', description: '服务器成功处理了部分 GET 请求', category: '成功响应 (200–299)', color: '#22c55e' },
  207: { name: 'Multi-Status', description: '返回多个状态码的响应', category: '成功响应 (200–299)', color: '#22c55e' },
  300: { name: 'Multiple Choices', description: '存在多种可能的响应', category: '重定向 (300–399)', color: '#f59e0b' },
  301: { name: 'Moved Permanently', description: '请求的资源已永久移动', category: '重定向 (300–399)', color: '#f59e0b' },
  302: { name: 'Found', description: '请求的资源临时从其他位置响应', category: '重定向 (300–399)', color: '#f59e0b' },
  303: { name: 'See Other', description: '对应当使用 GET 方法获取资源', category: '重定向 (300–399)', color: '#f59e0b' },
  304: { name: 'Not Modified', description: '资源自上次请求以来未被修改', category: '重定向 (300–399)', color: '#f59e0b' },
  307: { name: 'Temporary Redirect', description: '临时重定向', category: '重定向 (300–399)', color: '#f59e0b' },
  308: { name: 'Permanent Redirect', description: '永久重定向', category: '重定向 (300–399)', color: '#f59e0b' },
  400: { name: 'Bad Request', description: '请求有语法错误或参数错误', category: '客户端错误 (400–499)', color: '#ef4444' },
  401: { name: 'Unauthorized', description: '需要身份验证', category: '客户端错误 (400–499)', color: '#ef4444' },
  402: { name: 'Payment Required', description: '保留将来使用', category: '客户端错误 (400–499)', color: '#ef4444' },
  403: { name: 'Forbidden', description: '服务器拒绝执行请求', category: '客户端错误 (400–499)', color: '#ef4444' },
  404: { name: 'Not Found', description: '请求的资源不存在', category: '客户端错误 (400–499)', color: '#ef4444' },
  405: { name: 'Method Not Allowed', description: '请求方法不被允许', category: '客户端错误 (400–499)', color: '#ef4444' },
  406: { name: 'Not Acceptable', description: '请求的内容特性无法满足', category: '客户端错误 (400–499)', color: '#ef4444' },
  407: { name: 'Proxy Authentication Required', description: '需要代理身份验证', category: '客户端错误 (400–499)', color: '#ef4444' },
  408: { name: 'Request Timeout', description: '请求超时', category: '客户端错误 (400–499)', color: '#ef4444' },
  409: { name: 'Conflict', description: '请求存在冲突', category: '客户端错误 (400–499)', color: '#ef4444' },
  410: { name: 'Gone', description: '资源已永久删除', category: '客户端错误 (400–499)', color: '#ef4444' },
  411: { name: 'Length Required', description: '请求头缺少 Content-Length', category: '客户端错误 (400–499)', color: '#ef4444' },
  412: { name: 'Precondition Failed', description: '前置条件失败', category: '客户端错误 (400–499)', color: '#ef4444' },
  413: { name: 'Payload Too Large', description: '请求体过大', category: '客户端错误 (400–499)', color: '#ef4444' },
  414: { name: 'URI Too Long', description: 'URI 过长', category: '客户端错误 (400–499)', color: '#ef4444' },
  415: { name: 'Unsupported Media Type', description: '不支持的媒体类型', category: '客户端错误 (400–499)', color: '#ef4444' },
  416: { name: 'Range Not Satisfiable', description: '范围无法满足', category: '客户端错误 (400–499)', color: '#ef4444' },
  417: { name: 'Expectation Failed', description: '期望值失败', category: '客户端错误 (400–499)', color: '#ef4444' },
  418: { name: "I'm a teapot", description: '我是一个茶壶 (RFC 2324 愚人节玩笑)', category: '客户端错误 (400–499)', color: '#ef4444' },
  421: { name: 'Misdirected Request', description: '请求被错误地定向', category: '客户端错误 (400–499)', color: '#ef4444' },
  422: { name: 'Unprocessable Entity', description: '请求格式正确但语义错误', category: '客户端错误 (400–499)', color: '#ef4444' },
  423: { name: 'Locked', description: '资源被锁定', category: '客户端错误 (400–499)', color: '#ef4444' },
  424: { name: 'Failed Dependency', description: '依赖失败', category: '客户端错误 (400–499)', color: '#ef4444' },
  425: { name: 'Too Early', description: '请求过早', category: '客户端错误 (400–499)', color: '#ef4444' },
  426: { name: 'Upgrade Required', description: '需要升级协议', category: '客户端错误 (400–499)', color: '#ef4444' },
  428: { name: 'Precondition Required', description: '需要前置条件', category: '客户端错误 (400–499)', color: '#ef4444' },
  429: { name: 'Too Many Requests', description: '请求过多 (速率限制)', category: '客户端错误 (400–499)', color: '#ef4444' },
  431: { name: 'Request Header Fields Too Large', description: '请求头字段太大', category: '客户端错误 (400–499)', color: '#ef4444' },
  451: { name: 'Unavailable For Legal Reasons', description: '因法律原因不可用', category: '客户端错误 (400–499)', color: '#ef4444' },
  500: { name: 'Internal Server Error', description: '服务器内部错误', category: '服务器错误 (500–599)', color: '#8b5cf6' },
  501: { name: 'Not Implemented', description: '服务器不支持该功能', category: '服务器错误 (500–599)', color: '#8b5cf6' },
  502: { name: 'Bad Gateway', description: '网关错误', category: '服务器错误 (500–599)', color: '#8b5cf6' },
  503: { name: 'Service Unavailable', description: '服务暂时不可用', category: '服务器错误 (500–599)', color: '#8b5cf6' },
  504: { name: 'Gateway Timeout', description: '网关超时', category: '服务器错误 (500–599)', color: '#8b5cf6' },
  505: { name: 'HTTP Version Not Supported', description: '不支持的 HTTP 版本', category: '服务器错误 (500–599)', color: '#8b5cf6' },
  506: { name: 'Variant Also Negotiates', description: '变体也在协商', category: '服务器错误 (500–599)', color: '#8b5cf6' },
  507: { name: 'Insufficient Storage', description: '存储空间不足', category: '服务器错误 (500–599)', color: '#8b5cf6' },
  508: { name: 'Loop Detected', description: '检测到循环', category: '服务器错误 (500–599)', color: '#8b5cf6' },
  510: { name: 'Not Extended', description: '未扩展', category: '服务器错误 (500–599)', color: '#8b5cf6' },
  511: { name: 'Network Authentication Required', description: '需要网络身份验证', category: '服务器错误 (500–599)', color: '#8b5cf6' },
}

const DNS_TYPE_MAP: Record<string, number> = {
  A: 1,
  AAAA: 28,
  CNAME: 5,
  MX: 15,
  TXT: 16,
  NS: 2,
  SOA: 6,
  PTR: 12,
}

const DNS_TYPES = ['A', 'AAAA', 'MX', 'TXT', 'NS', 'CNAME', 'SOA', 'PTR']

const COMMON_PORTS: PortInfo[] = [
  { port: 21, protocol: 'TCP', service: 'FTP', description: '文件传输协议（控制）', status: 'unknown', common: true },
  { port: 22, protocol: 'TCP', service: 'SSH', description: '安全外壳协议', status: 'unknown', common: true },
  { port: 23, protocol: 'TCP', service: 'Telnet', description: '远程终端协议', status: 'unknown', common: true },
  { port: 25, protocol: 'TCP', service: 'SMTP', description: '简单邮件传输协议', status: 'unknown', common: true },
  { port: 53, protocol: 'UDP', service: 'DNS', description: '域名系统', status: 'unknown', common: true },
  { port: 67, protocol: 'UDP', service: 'DHCP', description: '动态主机配置协议（服务器）', status: 'unknown', common: false },
  { port: 68, protocol: 'UDP', service: 'DHCP', description: '动态主机配置协议（客户端）', status: 'unknown', common: false },
  { port: 69, protocol: 'UDP', service: 'TFTP', description: '简单文件传输协议', status: 'unknown', common: false },
  { port: 80, protocol: 'TCP', service: 'HTTP', description: '超文本传输协议', status: 'unknown', common: true },
  { port: 110, protocol: 'TCP', service: 'POP3', description: '邮局协议版本3', status: 'unknown', common: true },
  { port: 119, protocol: 'TCP', service: 'NNTP', description: '网络新闻传输协议', status: 'unknown', common: false },
  { port: 123, protocol: 'UDP', service: 'NTP', description: '网络时间协议', status: 'unknown', common: false },
  { port: 135, protocol: 'TCP', service: 'RPC', description: '远程过程调用', status: 'unknown', common: false },
  { port: 137, protocol: 'UDP', service: 'NetBIOS', description: 'NetBIOS 名称服务', status: 'unknown', common: false },
  { port: 138, protocol: 'UDP', service: 'NetBIOS', description: 'NetBIOS 数据报服务', status: 'unknown', common: false },
  { port: 139, protocol: 'TCP', service: 'NetBIOS', description: 'NetBIOS 会话服务', status: 'unknown', common: false },
  { port: 143, protocol: 'TCP', service: 'IMAP', description: '互联网消息访问协议', status: 'unknown', common: true },
  { port: 161, protocol: 'UDP', service: 'SNMP', description: '简单网络管理协议', status: 'unknown', common: false },
  { port: 162, protocol: 'UDP', service: 'SNMP', description: 'SNMP 陷阱', status: 'unknown', common: false },
  { port: 179, protocol: 'TCP', service: 'BGP', description: '边界网关协议', status: 'unknown', common: false },
  { port: 389, protocol: 'TCP', service: 'LDAP', description: '轻量级目录访问协议', status: 'unknown', common: false },
  { port: 443, protocol: 'TCP', service: 'HTTPS', description: '安全超文本传输协议', status: 'unknown', common: true },
  { port: 445, protocol: 'TCP', service: 'SMB', description: '服务器消息块', status: 'unknown', common: false },
  { port: 465, protocol: 'TCP', service: 'SMTPS', description: 'SMTP 安全（SSL）', status: 'unknown', common: false },
  { port: 514, protocol: 'UDP', service: 'Syslog', description: '系统日志', status: 'unknown', common: false },
  { port: 515, protocol: 'TCP', service: 'LPD', description: '行式打印机守护进程', status: 'unknown', common: false },
  { port: 587, protocol: 'TCP', service: 'SMTP', description: 'SMTP 提交端口', status: 'unknown', common: false },
  { port: 631, protocol: 'TCP', service: 'IPP', description: '互联网打印协议', status: 'unknown', common: false },
  { port: 636, protocol: 'TCP', service: 'LDAPS', description: 'LDAP 安全（SSL）', status: 'unknown', common: false },
  { port: 873, protocol: 'TCP', service: 'rsync', description: 'rsync 文件同步', status: 'unknown', common: false },
  { port: 993, protocol: 'TCP', service: 'IMAPS', description: 'IMAP 安全（SSL）', status: 'unknown', common: false },
  { port: 995, protocol: 'TCP', service: 'POP3S', description: 'POP3 安全（SSL）', status: 'unknown', common: false },
  { port: 1080, protocol: 'TCP', service: 'SOCKS', description: 'SOCKS 代理', status: 'unknown', common: false },
  { port: 1433, protocol: 'TCP', service: 'MSSQL', description: 'Microsoft SQL Server', status: 'unknown', common: false },
  { port: 1434, protocol: 'UDP', service: 'MSSQL', description: 'MSSQL 浏览器', status: 'unknown', common: false },
  { port: 1521, protocol: 'TCP', service: 'Oracle', description: 'Oracle 数据库', status: 'unknown', common: false },
  { port: 1723, protocol: 'TCP', service: 'PPTP', description: '点对点隧道协议', status: 'unknown', common: false },
  { port: 2049, protocol: 'TCP', service: 'NFS', description: '网络文件系统', status: 'unknown', common: false },
  { port: 3306, protocol: 'TCP', service: 'MySQL', description: 'MySQL 数据库', status: 'unknown', common: true },
  { port: 3389, protocol: 'TCP', service: 'RDP', description: '远程桌面协议', status: 'unknown', common: true },
  { port: 5060, protocol: 'UDP', service: 'SIP', description: '会话发起协议', status: 'unknown', common: false },
  { port: 5432, protocol: 'TCP', service: 'PostgreSQL', description: 'PostgreSQL 数据库', status: 'unknown', common: false },
  { port: 5500, protocol: 'TCP', service: 'VNC', description: '虚拟网络计算', status: 'unknown', common: false },
  { port: 5900, protocol: 'TCP', service: 'VNC', description: 'VNC 远程桌面', status: 'unknown', common: false },
  { port: 6379, protocol: 'TCP', service: 'Redis', description: 'Redis 数据库', status: 'unknown', common: false },
  { port: 8000, protocol: 'TCP', service: 'HTTP', description: 'HTTP 备用端口（常用开发）', status: 'unknown', common: true },
  { port: 8080, protocol: 'TCP', service: 'HTTP', description: 'HTTP 代理/备用端口', status: 'unknown', common: true },
  { port: 8443, protocol: 'TCP', service: 'HTTPS', description: 'HTTPS 备用端口', status: 'unknown', common: false },
  { port: 8888, protocol: 'TCP', service: 'HTTP', description: 'HTTP 开发服务器', status: 'unknown', common: false },
  { port: 9200, protocol: 'TCP', service: 'Elasticsearch', description: 'Elasticsearch', status: 'unknown', common: false },
  { port: 27017, protocol: 'TCP', service: 'MongoDB', description: 'MongoDB 数据库', status: 'unknown', common: false },
]

// ==================== 工具函数 ====================
function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

function getDnsTypeName(type: number): string {
  for (const [name, num] of Object.entries(DNS_TYPE_MAP)) {
    if (num === type) return name
  }
  return String(type)
}

// ==================== 历史记录管理 ====================
function loadHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return []
}

function saveHistory(items: HistoryItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, HISTORY_MAX)))
  } catch {}
}

function addHistory(type: string, query: string): HistoryItem[] {
  const history = loadHistory()
  const newItem: HistoryItem = {
    id: generateId(),
    type,
    query,
    timestamp: Date.now(),
  }
  const filtered = history.filter((h) => !(h.type === type && h.query === query))
  const result = [newItem, ...filtered].slice(0, HISTORY_MAX)
  saveHistory(result)
  return result
}

// ==================== 信息卡片组件 ====================
function InfoCard({
  icon,
  label,
  value,
  subValue,
  accentColor,
  delay = 0,
}: {
  icon: React.ReactNode
  label: string
  value: string
  subValue?: string
  accentColor?: string
  delay?: number
}) {
  return (
    <div
      style={{
        padding: 14,
        borderRadius: 12,
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        backdropFilter: 'blur(10px)',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        animation: `fadeSlideUp 0.4s ease-out ${delay}s both`,
      }}
      className="hover-lift"
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 8,
          color: accentColor || 'var(--text-secondary)',
        }}
      >
        {icon}
        <span style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>{value}</div>
      {subValue && <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>{subValue}</div>}
    </div>
  )
}

// ==================== 复制按钮组件 ====================
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }, [text])

  return (
    <button
      onClick={handleCopy}
      style={{
        padding: 4,
        borderRadius: 6,
        background: 'transparent',
        border: 'none',
        color: 'var(--text-secondary)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = 'var(--accent)'
        e.currentTarget.style.background = 'var(--accent-bg)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = 'var(--text-secondary)'
        e.currentTarget.style.background = 'transparent'
      }}
      title="复制"
    >
      {copied ? <Check size={14} style={{ color: '#22c55e' }} /> : <Copy size={14} />}
    </button>
  )
}

// ==================== IP 信息查询模块 ====================
function IPInfoPanel() {
  const [ipInput, setIpInput] = useState('')
  const [result, setResult] = useState<IPInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>(() => loadHistory().filter((h) => h.type === 'ip'))

  const handleLookup = useCallback(async (ip?: string) => {
    const targetIp = ip ?? ipInput.trim()
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const ipPart = targetIp ? `/${encodeURIComponent(targetIp)}` : ''
      const res = await fetch(`https://ipapi.co${ipPart}/json/`)
      if (!res.ok) throw new Error(`查询失败: HTTP ${res.status}`)
      const data = await res.json()
      if (data.error) throw new Error(data.reason || '查询失败')

      const info: IPInfo = {
        ip: data.ip || targetIp || '未知',
        version: data.version,
        city: data.city,
        region: data.region,
        country_name: data.country_name,
        country_code: data.country_code,
        country_capital: data.country_capital,
        postal: data.postal,
        latitude: data.latitude,
        longitude: data.longitude,
        timezone: data.timezone,
        currency: data.currency,
        currency_symbol: data.currency_symbol,
        asn: data.asn,
        org: data.org,
        isp: data.isp,
        languages: data.languages,
        country_population: data.country_population,
        country_area: data.country_area,
        utc_offset: data.utc_offset,
      }
      setResult(info)
      const queryIp = targetIp || info.ip || '本机'
      setHistory(addHistory('ip', queryIp).filter((h) => h.type === 'ip'))
    } catch (err) {
      try {
        const ipPart = targetIp ? `/${encodeURIComponent(targetIp)}` : ''
        const res = await fetch(`http://ip-api.com/json${ipPart}?lang=zh-CN`)
        if (!res.ok) throw new Error(`查询失败: HTTP ${res.status}`)
        const data = await res.json()
        if (data.status === 'fail') throw new Error(data.message || '查询失败')

        const info: IPInfo = {
          ip: data.query || targetIp || '未知',
          version: 'IPv4',
          city: data.city,
          region: data.regionName,
          country_name: data.country,
          country_code: data.countryCode,
          latitude: data.lat,
          longitude: data.lon,
          timezone: data.timezone,
          asn: data.as,
          org: data.org,
          isp: data.isp,
          postal: data.zip,
        }
        setResult(info)
        const queryIp = targetIp || info.ip || '本机'
        setHistory(addHistory('ip', queryIp).filter((h) => h.type === 'ip'))
      } catch (err2) {
        setError(err2 instanceof Error ? err2.message : '未知错误')
      }
    } finally {
      setLoading(false)
    }
  }, [ipInput])

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="输入 IP 地址（留空查询本机）"
            value={ipInput}
            onChange={(e) => setIpInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
            className="app-input"
            style={{
              width: '100%',
              padding: '10px 12px 10px 38px',
              borderRadius: 12,
              border: '1px solid var(--glass-border)',
              background: 'var(--glass-bg)',
              color: 'var(--text-primary)',
              outline: 'none',
              fontSize: 13,
              backdropFilter: 'blur(10px)',
              transition: 'all 0.2s ease',
            }}
          />
        </div>
        <button
          onClick={() => handleLookup()}
          disabled={loading}
          className="app-button"
          style={{
            padding: '10px 18px',
            borderRadius: 12,
            background: 'linear-gradient(135deg, var(--accent) 0%, #a29bfe 100%)',
            color: '#fff',
            border: 'none',
            cursor: loading ? 'wait' : 'pointer',
            fontSize: 13,
            fontWeight: 500,
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {loading ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Search size={14} />}
          {loading ? '查询中' : '查询'}
        </button>
      </div>

      {history.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock size={12} />
            历史记录
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {history.slice(0, 8).map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  if (item.query !== '本机') {
                    setIpInput(item.query)
                    handleLookup(item.query)
                  } else {
                    setIpInput('')
                    handleLookup('')
                  }
                }}
                style={{
                  padding: '4px 10px',
                  borderRadius: 8,
                  background: 'var(--glass-bg)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-secondary)',
                  fontSize: 12,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  fontFamily: 'monospace',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent)'
                  e.currentTarget.style.color = 'var(--accent)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--glass-border)'
                  e.currentTarget.style.color = 'var(--text-secondary)'
                }}
              >
                {item.query}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div style={{
          padding: 14,
          marginBottom: 16,
          borderRadius: 12,
          background: 'var(--error-bg)',
          border: '1px solid var(--error)',
          color: 'var(--error)',
          fontSize: 13,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          animation: 'fadeSlideUp 0.3s ease-out',
        }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div style={{
          padding: 20,
          borderRadius: 16,
          background: 'linear-gradient(135deg, rgba(155, 138, 240, 0.12) 0%, rgba(79, 70, 229, 0.06) 100%)',
          border: '1px solid var(--glass-border)',
          backdropFilter: 'blur(10px)',
          animation: 'fadeSlideUp 0.4s ease-out',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: 'linear-gradient(135deg, var(--accent) 0%, #a29bfe 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
            }}>
              <Globe size={24} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                {result.ip}
                <CopyButton text={result.ip} />
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <MapPin size={14} style={{ color: 'var(--accent)' }} />
                {[result.city, result.region, result.country_name].filter(Boolean).join(', ') || '未知位置'}
              </div>
            </div>
            {result.version && (
              <span style={{
                padding: '4px 10px',
                borderRadius: 8,
                background: 'var(--accent-bg)',
                color: 'var(--accent)',
                fontSize: 11,
                fontWeight: 600,
              }}>
                {result.version}
              </span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
            <InfoItem icon={<MapPin size={16} />} label="国家" value={result.country_name || '-'} subValue={result.country_code} />
            <InfoItem icon={<MapPin size={16} />} label="城市" value={result.city || '-'} subValue={result.postal ? `邮编: ${result.postal}` : undefined} />
            <InfoItem icon={<Server size={16} />} label="ISP" value={result.isp || '-'} subValue={result.org} />
            <InfoItem icon={<Hash size={16} />} label="ASN" value={result.asn || '-'} />
            <InfoItem icon={<Clock size={16} />} label="时区" value={result.timezone || '-'} subValue={result.utc_offset} />
            <InfoItem icon={<Globe size={16} />} label="坐标" value={result.latitude && result.longitude ? `${result.latitude.toFixed(4)}, ${result.longitude.toFixed(4)}` : '-'} />
            {result.currency && (
              <InfoItem icon={<Info size={16} />} label="货币" value={result.currency} subValue={result.currency_symbol} />
            )}
            {result.country_capital && (
              <InfoItem icon={<MapPin size={16} />} label="首都" value={result.country_capital} />
            )}
          </div>
        </div>
      )}

      {!result && !loading && !error && (
        <div style={{
          padding: 40,
          textAlign: 'center',
          color: 'var(--text-secondary)',
          fontSize: 13,
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🌐</div>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>IP 信息查询</div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>输入 IP 地址或留空查询本机 IP 位置信息</div>
        </div>
      )}
    </div>
  )
}

function InfoItem({ icon, label, value, subValue }: { icon: React.ReactNode; label: string; value: string; subValue?: string }) {
  return (
    <div style={{
      padding: 10,
      borderRadius: 10,
      background: 'var(--glass-bg)',
      border: '1px solid var(--glass-border)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, color: 'var(--text-secondary)' }}>
        {icon}
        <span style={{ fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{value}</div>
      {subValue && <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{subValue}</div>}
    </div>
  )
}

// ==================== DNS 查找模块 ====================
function DNSLookupPanel() {
  const [domain, setDomain] = useState('')
  const [dnsType, setDnsType] = useState('A')
  const [records, setRecords] = useState<DNSRecord[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>(() => loadHistory().filter((h) => h.type === 'dns'))

  const handleLookup = useCallback(async (dom?: string) => {
    const targetDomain = dom ?? domain.trim()
    if (!targetDomain) {
      setError('请输入域名')
      return
    }

    setLoading(true)
    setError(null)
    setRecords(null)

    try {
      const cleanDomain = targetDomain.replace(/^https?:\/\//, '').split('/')[0]
      const res = await fetch(
        `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(cleanDomain)}&type=${dnsType}`,
        { headers: { accept: 'application/dns-json' } }
      )
      if (!res.ok) throw new Error(`DNS 查询失败: HTTP ${res.status}`)
      const data = await res.json()

      const answer: DNSRecord[] = (data.Answer || []).map((r: any) => ({
        name: r.name,
        type: r.type,
        typeName: getDnsTypeName(r.type),
        TTL: r.TTL,
        data: r.data,
      }))
      setRecords(answer)
      setHistory(addHistory('dns', `${dnsType}:${cleanDomain}`).filter((h) => h.type === 'dns'))
    } catch (err) {
      setError(err instanceof Error ? err.message : '查询失败')
    } finally {
      setLoading(false)
    }
  }, [domain, dnsType])

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Server size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="输入域名（如 example.com）"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
            className="app-input"
            style={{
              width: '100%',
              padding: '10px 12px 10px 38px',
              borderRadius: 12,
              border: '1px solid var(--glass-border)',
              background: 'var(--glass-bg)',
              color: 'var(--text-primary)',
              outline: 'none',
              fontSize: 13,
            }}
          />
        </div>
        <select
          value={dnsType}
          onChange={(e) => setDnsType(e.target.value)}
          style={{
            padding: '10px 14px',
            borderRadius: 12,
            border: '1px solid var(--glass-border)',
            background: 'var(--glass-bg)',
            color: 'var(--text-primary)',
            fontSize: 13,
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          {DNS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <button
          onClick={() => handleLookup()}
          disabled={loading}
          className="app-button"
          style={{
            padding: '10px 18px',
            borderRadius: 12,
            background: 'linear-gradient(135deg, var(--accent) 0%, #a29bfe 100%)',
            color: '#fff',
            border: 'none',
            cursor: loading ? 'wait' : 'pointer',
            fontSize: 13,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {loading ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Search size={14} />}
          查询
        </button>
      </div>

      {history.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock size={12} />
            历史记录
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {history.slice(0, 8).map((item) => {
              const [type, dom] = item.query.split(':')
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setDomain(dom)
                    setDnsType(type)
                    handleLookup(dom)
                  }}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 8,
                    background: 'var(--glass-bg)',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--text-secondary)',
                    fontSize: 12,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    fontFamily: 'monospace',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent)'
                    e.currentTarget.style.color = 'var(--accent)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--glass-border)'
                    e.currentTarget.style.color = 'var(--text-secondary)'
                  }}
                >
                  <span style={{ padding: '1px 6px', borderRadius: 4, background: 'var(--accent-bg)', color: 'var(--accent)', fontSize: 10, fontWeight: 600 }}>{type}</span>
                  {dom}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {error && (
        <div style={{
          padding: 14,
          marginBottom: 16,
          borderRadius: 12,
          background: 'var(--error-bg)',
          border: '1px solid var(--error)',
          color: 'var(--error)',
          fontSize: 13,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          animation: 'fadeSlideUp 0.3s ease-out',
        }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {records && records.length > 0 && (
        <div style={{
          borderRadius: 16,
          overflow: 'hidden',
          border: '1px solid var(--glass-border)',
          animation: 'fadeSlideUp 0.4s ease-out',
        }}>
          <div style={{
            padding: '12px 16px',
            background: 'var(--glass-bg)',
            borderBottom: '1px solid var(--glass-border)',
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <Database size={16} style={{ color: 'var(--accent)' }} />
            查询结果 ({records.length} 条记录)
          </div>
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead style={{ position: 'sticky', top: 0, background: 'var(--window-bg)', zIndex: 1 }}>
                <tr>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--glass-border)' }}>类型</th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--glass-border)' }}>名称</th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--glass-border)' }}>TTL</th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--glass-border)' }}>数据</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--glass-border)' }} className="table-row-hover">
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: 6,
                        background: 'var(--accent-bg)',
                        color: 'var(--accent)',
                        fontSize: 11,
                        fontWeight: 600,
                        fontFamily: 'monospace',
                      }}>
                        {record.typeName}
                      </span>
                    </td>
                    <td style={{ padding: '10px 16px', fontFamily: 'monospace', color: 'var(--text-primary)', fontSize: 12 }}>{record.name}</td>
                    <td style={{ padding: '10px 16px', fontFamily: 'monospace', color: 'var(--text-secondary)', fontSize: 12 }}>{record.TTL}s</td>
                    <td style={{ padding: '10px 16px', fontFamily: 'monospace', color: 'var(--text-primary)', fontSize: 12, wordBreak: 'break-all', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ flex: 1 }}>{record.data}</span>
                      <CopyButton text={record.data} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {records && records.length === 0 && (
        <div style={{
          padding: 40,
          textAlign: 'center',
          borderRadius: 16,
          background: 'var(--glass-bg)',
          border: '1px solid var(--glass-border)',
          animation: 'fadeSlideUp 0.4s ease-out',
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>未找到 {dnsType} 记录</div>
        </div>
      )}

      {!records && !loading && !error && (
        <div style={{
          padding: 40,
          textAlign: 'center',
          color: 'var(--text-secondary)',
          fontSize: 13,
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>DNS 查找</div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>使用 Cloudflare DNS over HTTPS 进行安全查询</div>
        </div>
      )}
    </div>
  )
}

// ==================== URL 编解码模块 ====================
function URLCodecPanel() {
  const [mode, setMode] = useState<'url-encode' | 'url-decode' | 'base64-encode' | 'base64-decode'>('url-encode')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleConvert = useCallback(() => {
    setError(null)
    try {
      let result = ''
      switch (mode) {
        case 'url-encode':
          result = encodeURIComponent(input)
          break
        case 'url-decode':
          result = decodeURIComponent(input)
          break
        case 'base64-encode':
          result = btoa(unescape(encodeURIComponent(input)))
          break
        case 'base64-decode':
          result = decodeURIComponent(escape(atob(input)))
          break
      }
      setOutput(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : '转换失败')
      setOutput('')
    }
  }, [mode, input])

  const handleSwap = useCallback(() => {
    setInput(output)
    setOutput('')
    if (mode === 'url-encode') setMode('url-decode')
    else if (mode === 'url-decode') setMode('url-encode')
    else if (mode === 'base64-encode') setMode('base64-decode')
    else if (mode === 'base64-decode') setMode('base64-encode')
  }, [mode, output])

  const handleClear = useCallback(() => {
    setInput('')
    setOutput('')
    setError(null)
  }, [])

  const modes = [
    { id: 'url-encode' as const, label: 'URL 编码', icon: <Lock size={14} /> },
    { id: 'url-decode' as const, label: 'URL 解码', icon: <Unlock size={14} /> },
    { id: 'base64-encode' as const, label: 'Base64 编码', icon: <Shield size={14} /> },
    { id: 'base64-decode' as const, label: 'Base64 解码', icon: <Shield size={14} /> },
  ]

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <div style={{
        display: 'flex',
        gap: 6,
        marginBottom: 16,
        padding: 4,
        borderRadius: 12,
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
      }}>
        {modes.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            style={{
              flex: 1,
              padding: '10px 12px',
              borderRadius: 8,
              background: mode === m.id ? 'linear-gradient(135deg, var(--accent) 0%, #a29bfe 100%)' : 'transparent',
              color: mode === m.id ? '#fff' : 'var(--text-secondary)',
              border: 'none',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: mode === m.id ? 600 : 400,
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            {m.icon}
            {m.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
        <div>
          <div style={{
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--text-secondary)',
            marginBottom: 6,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span>输入</span>
            <span style={{ fontWeight: 400, textTransform: 'none' }}>{input.length} 字符</span>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={mode.includes('url') ? '输入要编码/解码的 URL 或文本...' : '输入要编码/解码的文本...'}
            className="app-input"
            style={{
              width: '100%',
              height: 120,
              padding: 12,
              borderRadius: 12,
              border: '1px solid var(--glass-border)',
              background: 'var(--glass-bg)',
              color: 'var(--text-primary)',
              outline: 'none',
              fontSize: 13,
              fontFamily: 'monospace',
              resize: 'vertical',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button
            onClick={handleConvert}
            className="app-button"
            style={{
              padding: '10px 24px',
              borderRadius: 12,
              background: 'linear-gradient(135deg, var(--accent) 0%, #a29bfe 100%)',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <ChevronRight size={16} />
            转换
          </button>
          <button
            onClick={handleSwap}
            disabled={!output}
            className="app-button"
            style={{
              padding: '10px 16px',
              borderRadius: 12,
              background: 'var(--glass-bg)',
              color: output ? 'var(--text-primary)' : 'var(--text-secondary)',
              border: '1px solid var(--glass-border)',
              cursor: output ? 'pointer' : 'not-allowed',
              fontSize: 13,
              opacity: output ? 1 : 0.5,
            }}
            title="交换输入输出"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={handleClear}
            className="app-button"
            style={{
              padding: '10px 16px',
              borderRadius: 12,
              background: 'var(--glass-bg)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--glass-border)',
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            清空
          </button>
        </div>

        <div>
          <div style={{
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--text-secondary)',
            marginBottom: 6,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span>输出</span>
            {output && (
              <span style={{ fontWeight: 400, textTransform: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                {output.length} 字符
                <CopyButton text={output} />
              </span>
            )}
          </div>
          <div style={{
            minHeight: 120,
            padding: 12,
            borderRadius: 12,
            border: '1px solid var(--glass-border)',
            background: 'var(--glass-bg)',
            color: 'var(--text-primary)',
            fontSize: 13,
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            animation: output ? 'fadeIn 0.3s ease-out' : 'none',
          }}>
            {output || <span style={{ color: 'var(--text-secondary)', opacity: 0.5 }}>转换结果将显示在这里...</span>}
          </div>
        </div>
      </div>

      {error && (
        <div style={{
          padding: 12,
          marginTop: 12,
          borderRadius: 12,
          background: 'var(--error-bg)',
          border: '1px solid var(--error)',
          color: 'var(--error)',
          fontSize: 13,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          animation: 'fadeSlideUp 0.3s ease-out',
        }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}

// ==================== 网络状态监控模块 ====================
function NetworkStatusPanel() {
  const [online, setOnline] = useState(() => typeof navigator !== 'undefined' ? navigator.onLine : true)
  const [connectionInfo, setConnectionInfo] = useState<{
    effectiveType?: string
    downlink?: number
    rtt?: number
    saveData?: boolean
    type?: string
  }>({})
  const [latency, setLatency] = useState<number | null>(null)
  const [latencyHistory, setLatencyHistory] = useState<number[]>([])
  const [speedTestRunning, setSpeedTestRunning] = useState(false)
  const [downloadSpeed, setDownloadSpeed] = useState<number | null>(null)

  useEffect(() => {
    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
    if (conn) {
      const updateConnection = () => {
        setConnectionInfo({
          effectiveType: conn.effectiveType,
          downlink: conn.downlink,
          rtt: conn.rtt,
          saveData: conn.saveData,
          type: conn.type,
        })
      }
      updateConnection()
      conn.addEventListener('change', updateConnection)
      return () => conn.removeEventListener('change', updateConnection)
    }
  }, [])

  useEffect(() => {
    let mounted = true

    const measureLatency = async () => {
      const start = performance.now()
      try {
        await fetch('https://www.cloudflare.com/favicon.ico', { method: 'HEAD', cache: 'no-store' })
        const elapsed = Math.round(performance.now() - start)
        if (mounted) {
          setLatency(elapsed)
          setLatencyHistory((prev) => [...prev.slice(-19), elapsed])
        }
      } catch {
        if (mounted) {
          setLatency(null)
        }
      }
    }

    measureLatency()
    const interval = setInterval(measureLatency, 5000)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  const handleSpeedTest = useCallback(async () => {
    if (speedTestRunning) return
    setSpeedTestRunning(true)
    setDownloadSpeed(null)

    try {
      const testFiles = [
        'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js',
        'https://cdn.jsdelivr.net/npm/react@18.2.0/umd/react.production.min.js',
      ]
      let maxSpeed = 0

      for (const url of testFiles) {
        try {
          const start = performance.now()
          const res = await fetch(url, { cache: 'no-store' })
          const blob = await res.blob()
          const elapsed = (performance.now() - start) / 1000
          if (elapsed > 0 && blob.size > 0) {
            const speedMbps = (blob.size * 8) / (1024 * 1024) / elapsed
            maxSpeed = Math.max(maxSpeed, speedMbps)
          }
        } catch {
          // skip
        }
      }

      setDownloadSpeed(maxSpeed)
    } finally {
      setSpeedTestRunning(false)
    }
  }, [speedTestRunning])

  const maxLatency = Math.max(...latencyHistory, 100)
  const getLatencyColor = (lat: number) => {
    if (lat < 50) return '#22c55e'
    if (lat < 100) return '#f59e0b'
    return '#ef4444'
  }

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: 12,
        marginBottom: 20,
      }}>
        <InfoCard
          icon={online ? <Wifi size={18} style={{ color: '#22c55e' }} /> : <WifiOff size={18} style={{ color: '#ef4444' }} />}
          label="连接状态"
          value={online ? '在线' : '离线'}
          subValue={online ? '网络已连接' : '网络已断开'}
          accentColor={online ? '#22c55e' : '#ef4444'}
          delay={0.1}
        />
        <InfoCard
          icon={<Activity size={18} />}
          label="延迟"
          value={latency !== null ? `${latency} ms` : '测量中'}
          subValue={latency !== null ? (latency < 50 ? '优秀' : latency < 100 ? '良好' : '一般') : '等待数据'}
          accentColor={latency ? getLatencyColor(latency) : undefined}
          delay={0.15}
        />
        {connectionInfo.effectiveType && (
          <InfoCard
            icon={<Signal size={18} />}
            label="连接类型"
            value={connectionInfo.effectiveType.toUpperCase()}
            subValue={connectionInfo.type || '未知类型'}
            delay={0.2}
          />
        )}
        {connectionInfo.downlink && (
          <InfoCard
            icon={<Download size={18} />}
            label="下行速度预估"
            value={`${connectionInfo.downlink} Mbps`}
            subValue="浏览器 API 估算"
            delay={0.25}
          />
        )}
        {connectionInfo.rtt !== undefined && (
          <InfoCard
            icon={<Zap size={18} />}
            label="RTT"
            value={`${connectionInfo.rtt} ms`}
            subValue="浏览器 API 估算"
            delay={0.3}
          />
        )}
        {downloadSpeed !== null && (
          <InfoCard
            icon={<Gauge size={18} />}
            label="实测下载速度"
            value={`${downloadSpeed.toFixed(1)} Mbps`}
            subValue="实际测试结果"
            accentColor="#22c55e"
            delay={0.35}
          />
        )}
      </div>

      {latencyHistory.length > 1 && (
        <div style={{
          padding: 18,
          borderRadius: 16,
          background: 'var(--glass-bg)',
          border: '1px solid var(--glass-border)',
          backdropFilter: 'blur(10px)',
          marginBottom: 16,
          animation: 'fadeSlideUp 0.4s ease-out 0.2s both',
        }}>
          <div style={{
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: 'var(--text-primary)',
          }}>
            <BarChart3 size={16} style={{ color: 'var(--accent)' }} />
            延迟趋势图
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 80 }}>
            {latencyHistory.map((lat, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  minWidth: 8,
                  height: `${Math.max((lat / maxLatency) * 100, 5)}%`,
                  background: `linear-gradient(to top, ${getLatencyColor(lat)}, ${getLatencyColor(lat)}88)`,
                  borderRadius: '2px 2px 0 0',
                  transition: 'all 0.3s ease',
                }}
                title={`${lat} ms`}
              />
            ))}
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 8,
            fontSize: 11,
            color: 'var(--text-secondary)',
          }}>
            <span>20 个采样点</span>
            <span>最高: {maxLatency} ms</span>
          </div>
        </div>
      )}

      <div style={{
        padding: 18,
        borderRadius: 16,
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        backdropFilter: 'blur(10px)',
        animation: 'fadeSlideUp 0.4s ease-out 0.3s both',
      }}>
        <div style={{
          fontSize: 13,
          fontWeight: 600,
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          color: 'var(--text-primary)',
        }}>
          <Zap size={16} style={{ color: 'var(--accent)' }} />
          速度测试
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={handleSpeedTest}
            disabled={speedTestRunning}
            className="app-button"
            style={{
              flex: 1,
              padding: '12px 20px',
              borderRadius: 12,
              background: 'linear-gradient(135deg, var(--accent) 0%, #a29bfe 100%)',
              color: '#fff',
              border: 'none',
              cursor: speedTestRunning ? 'wait' : 'pointer',
              fontSize: 14,
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {speedTestRunning ? (
              <>
                <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                测试中...
              </>
            ) : (
              <>
                <Zap size={16} />
                开始速度测试
              </>
            )}
          </button>
        </div>
        <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-secondary)', textAlign: 'center' }}>
          测试结果仅供参考，使用 CDN 资源进行估算
        </div>
      </div>
    </div>
  )
}

function Gauge(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m12 14 4-4" />
      <path d="M3.34 19a10 10 0 1 1 17.32 0" />
    </svg>
  )
}

// ==================== HTTP 状态码查询模块 ====================
function HTTPStatusPanel() {
  const [searchCode, setSearchCode] = useState('')
  const [filteredCodes, setFilteredCodes] = useState<[number, HTTPStatusInfo][]>([])

  useEffect(() => {
    const q = searchCode.trim().toLowerCase()
    if (!q) {
      setFilteredCodes(Object.entries(HTTP_STATUS_CODES).map(([k, v]) => [parseInt(k), v]))
      return
    }

    const results = Object.entries(HTTP_STATUS_CODES)
      .filter(([code, info]) => {
        return (
          code.includes(q) ||
          info.name.toLowerCase().includes(q) ||
          info.description.toLowerCase().includes(q) ||
          info.category.toLowerCase().includes(q)
        )
      })
      .map(([k, v]) => [parseInt(k), v] as [number, HTTPStatusInfo])

    setFilteredCodes(results)
  }, [searchCode])

  const categories = [
    { name: '信息响应', range: '100-199', color: '#3b82f6' },
    { name: '成功响应', range: '200-299', color: '#22c55e' },
    { name: '重定向', range: '300-399', color: '#f59e0b' },
    { name: '客户端错误', range: '400-499', color: '#ef4444' },
    { name: '服务器错误', range: '500-599', color: '#8b5cf6' },
  ]

  const groupedCodes: Record<string, [number, HTTPStatusInfo][]> = {}
  filteredCodes.forEach(([code, info]) => {
    const category = info.category.split(' ')[0]
    if (!groupedCodes[category]) groupedCodes[category] = []
    groupedCodes[category].push([code, info])
  })

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
        <input
          type="text"
          placeholder="搜索状态码、名称或描述..."
          value={searchCode}
          onChange={(e) => setSearchCode(e.target.value)}
          className="app-input"
          style={{
            width: '100%',
            padding: '10px 12px 10px 38px',
            borderRadius: 12,
            border: '1px solid var(--glass-border)',
            background: 'var(--glass-bg)',
            color: 'var(--text-primary)',
            outline: 'none',
            fontSize: 13,
          }}
        />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
        gap: 8,
        marginBottom: 16,
      }}>
        {categories.map((cat) => (
          <div key={cat.name} style={{
            padding: 10,
            borderRadius: 10,
            background: 'var(--glass-bg)',
            border: `1px solid ${cat.color}33`,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: cat.color }}>{cat.range}</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{cat.name}</div>
          </div>
        ))}
      </div>

      <div style={{ maxHeight: 500, overflowY: 'auto', paddingRight: 4 }}>
        {Object.entries(groupedCodes).map(([category, codes]) => (
          <div key={category} style={{ marginBottom: 16 }}>
            <div style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--text-secondary)',
              marginBottom: 8,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}>
              <Info size={14} />
              {category}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {codes.map(([code, info]) => (
                <div
                  key={code}
                  style={{
                    padding: 12,
                    borderRadius: 10,
                    background: 'var(--glass-bg)',
                    border: '1px solid var(--glass-border)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    transition: 'all 0.2s ease',
                    animation: 'fadeSlideUp 0.3s ease-out',
                  }}
                  className="hover-lift"
                >
                  <div style={{
                    minWidth: 56,
                    height: 40,
                    borderRadius: 8,
                    background: `${info.color}22`,
                    color: info.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                    fontWeight: 700,
                    fontFamily: 'monospace',
                  }}>
                    {code}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                      {info.name}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {info.description}
                    </div>
                  </div>
                  <CopyButton text={String(code)} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {filteredCodes.length === 0 && searchCode && (
        <div style={{
          padding: 40,
          textAlign: 'center',
          color: 'var(--text-secondary)',
          fontSize: 13,
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
          <div>未找到匹配的状态码</div>
        </div>
      )}
    </div>
  )
}

// ==================== 端口扫描器模块 ====================
function PortScannerPanel() {
  const [scanTarget, setScanTarget] = useState('localhost')
  const [scanMode, setScanMode] = useState<'common' | 'well-known' | 'all'>('common')
  const [scanning, setScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [scanResults, setScanResults] = useState<PortInfo[]>([])
  const [scanStats, setScanStats] = useState({ open: 0, closed: 0, filtered: 0, total: 0 })

  const getPortsToScan = useCallback((): PortInfo[] => {
    switch (scanMode) {
      case 'common':
        return COMMON_PORTS.filter((p) => p.common)
      case 'well-known':
        return COMMON_PORTS.filter((p) => p.port <= 1024)
      case 'all':
        return [...COMMON_PORTS]
    }
  }, [scanMode])

  const handleScan = useCallback(async () => {
    if (scanning) return
    setScanning(true)
    setScanProgress(0)
    setScanStats({ open: 0, closed: 0, filtered: 0, total: 0 })

    const ports = getPortsToScan()
    const results: PortInfo[] = []
    let open = 0
    let closed = 0
    let filtered = 0

    for (let i = 0; i < ports.length; i++) {
      const port = { ...ports[i] }

      const simulateScan = () => {
        const rand = Math.random()
        if (port.port === 80 || port.port === 443 || port.port === 8080) {
          port.status = rand > 0.3 ? 'open' : 'filtered'
        } else if (port.service === 'SSH' || port.service === 'FTP' || port.service === 'MySQL') {
          port.status = rand > 0.5 ? 'open' : 'closed'
        } else if (port.common) {
          port.status = rand > 0.7 ? 'open' : rand > 0.4 ? 'filtered' : 'closed'
        } else {
          port.status = rand > 0.85 ? 'open' : rand > 0.6 ? 'filtered' : 'closed'
        }
      }

      simulateScan()

      if (port.status === 'open') open++
      else if (port.status === 'closed') closed++
      else filtered++

      results.push(port)
      setScanProgress(Math.round(((i + 1) / ports.length) * 100))
      setScanResults([...results])
      setScanStats({ open, closed, filtered, total: ports.length })

      await new Promise((resolve) => setTimeout(resolve, 40 + Math.random() * 80))
    }

    setScanning(false)
  }, [scanning, getPortsToScan])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <CheckCircle size={16} style={{ color: '#22c55e' }} />
      case 'closed':
        return <XCircle size={16} style={{ color: '#ef4444' }} />
      case 'filtered':
        return <AlertCircle size={16} style={{ color: '#f59e0b' }} />
      default:
        return <Info size={16} style={{ color: 'var(--text-secondary)' }} />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open': return '开放'
      case 'closed': return '关闭'
      case 'filtered': return '过滤'
      default: return '未知'
    }
  }

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 150 }}>
          <Server size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="目标主机 (如 localhost 或 192.168.1.1)"
            value={scanTarget}
            onChange={(e) => setScanTarget(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleScan()}
            className="app-input"
            style={{
              width: '100%',
              padding: '10px 12px 10px 38px',
              borderRadius: 12,
              border: '1px solid var(--glass-border)',
              background: 'var(--glass-bg)',
              color: 'var(--text-primary)',
              outline: 'none',
              fontSize: 13,
            }}
          />
        </div>
        <select
          value={scanMode}
          onChange={(e) => setScanMode(e.target.value as any)}
          style={{
            padding: '10px 14px',
            borderRadius: 12,
            border: '1px solid var(--glass-border)',
            background: 'var(--glass-bg)',
            color: 'var(--text-primary)',
            fontSize: 13,
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          <option value="common">常用端口 ({COMMON_PORTS.filter((p) => p.common).length})</option>
          <option value="well-known">知名端口 (0-1024)</option>
          <option value="all">全部 ({COMMON_PORTS.length})</option>
        </select>
        <button
          onClick={handleScan}
          disabled={scanning}
          className="app-button"
          style={{
            padding: '10px 18px',
            borderRadius: 12,
            background: 'linear-gradient(135deg, var(--accent) 0%, #a29bfe 100%)',
            color: '#fff',
            border: 'none',
            cursor: scanning ? 'wait' : 'pointer',
            fontSize: 13,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {scanning ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Terminal size={14} />}
          {scanning ? '扫描中' : '扫描'}
        </button>
      </div>

      {scanning && (
        <div style={{
          padding: 16,
          marginBottom: 16,
          borderRadius: 12,
          background: 'var(--glass-bg)',
          border: '1px solid var(--glass-border)',
          animation: 'fadeSlideUp 0.3s ease-out',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
            <span>正在扫描 {scanTarget}</span>
            <span>{scanProgress}%</span>
          </div>
          <div style={{ height: 6, background: 'var(--window-bg)', borderRadius: 3, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${scanProgress}%`,
                background: 'linear-gradient(90deg, var(--accent), #a29bfe)',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>
      )}

      {scanResults.length > 0 && (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 8,
            marginBottom: 16,
          }}>
            <div style={{
              padding: 10,
              borderRadius: 10,
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{scanStats.total}</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>总计</div>
            </div>
            <div style={{
              padding: 10,
              borderRadius: 10,
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#22c55e' }}>{scanStats.open}</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>开放</div>
            </div>
            <div style={{
              padding: 10,
              borderRadius: 10,
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#ef4444' }}>{scanStats.closed}</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>关闭</div>
            </div>
            <div style={{
              padding: 10,
              borderRadius: 10,
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#f59e0b' }}>{scanStats.filtered}</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>过滤</div>
            </div>
          </div>

          <div style={{ maxHeight: 400, overflowY: 'auto', paddingRight: 4 }}>
            {scanResults.map((port, idx) => (
              <div
                key={`${port.port}-${idx}`}
                style={{
                  padding: 10,
                  marginBottom: 6,
                  borderRadius: 10,
                  background: 'var(--glass-bg)',
                  border: '1px solid var(--glass-border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  animation: `fadeSlideUp 0.3s ease-out ${idx * 0.02}s both`,
                }}
                className="hover-lift"
              >
                <div style={{
                  minWidth: 52,
                  padding: '4px 8px',
                  borderRadius: 6,
                  background: 'var(--accent-bg)',
                  color: 'var(--accent)',
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  textAlign: 'center',
                }}>
                  {port.port}
                </div>
                <div style={{
                  minWidth: 45,
                  fontSize: 10,
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                }}>
                  {port.protocol}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{port.service}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{port.description}</div>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  borderRadius: 8,
                  background:
                    port.status === 'open' ? 'rgba(34, 197, 94, 0.15)' :
                    port.status === 'closed' ? 'rgba(239, 68, 68, 0.15)' :
                    'rgba(245, 158, 11, 0.15)',
                  fontSize: 11,
                  fontWeight: 600,
                  color:
                    port.status === 'open' ? '#22c55e' :
                    port.status === 'closed' ? '#ef4444' :
                    '#f59e0b',
                }}>
                  {getStatusIcon(port.status)}
                  {getStatusText(port.status)}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {!scanning && scanResults.length === 0 && (
        <div style={{
          padding: 40,
          textAlign: 'center',
          color: 'var(--text-secondary)',
          fontSize: 13,
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🛡️</div>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>端口扫描器</div>
          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 8 }}>扫描目标主机常用端口状态</div>
          <div style={{ fontSize: 11, opacity: 0.5, padding: '8px 16px', borderRadius: 8, background: 'var(--glass-bg)', display: 'inline-block' }}>
            ⚠️ 仅前端模拟展示，非真实扫描
          </div>
        </div>
      )}
    </div>
  )
}

// ==================== 主组件 ====================
const NetworkToolkitPro = memo(function NetworkToolkitPro() {
  const [activeTab, setActiveTab] = useState<ToolTab>('ip-info')

  const tabs: { id: ToolTab; label: string; icon: React.ReactNode }[] = [
    { id: 'ip-info', label: 'IP 信息', icon: <Globe size={16} /> },
    { id: 'dns-lookup', label: 'DNS 查找', icon: <Server size={16} /> },
    { id: 'url-codec', label: '编解码', icon: <Link2 size={16} /> },
    { id: 'network-status', label: '网络状态', icon: <Activity size={16} /> },
    { id: 'http-status', label: 'HTTP 状态码', icon: <Layers size={16} /> },
    { id: 'port-scanner', label: '端口扫描', icon: <Shield size={16} /> },
  ]

  const renderPanel = () => {
    switch (activeTab) {
      case 'ip-info':
        return <IPInfoPanel />
      case 'dns-lookup':
        return <DNSLookupPanel />
      case 'url-codec':
        return <URLCodecPanel />
      case 'network-status':
        return <NetworkStatusPanel />
      case 'http-status':
        return <HTTPStatusPanel />
      case 'port-scanner':
        return <PortScannerPanel />
      default:
        return null
    }
  }

  return (
    <div
      style={{
        height: '100%',
        overflowY: 'auto',
        padding: 20,
        background:
          'linear-gradient(180deg, var(--window-bg) 0%, var(--desktop-bg) 100%)',
        color: 'var(--text-primary)',
        position: 'relative',
      }}
      className="network-toolkit-scroll"
    >
      <style>{`
        @keyframes fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .network-toolkit-scroll::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .network-toolkit-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .network-toolkit-scroll::-webkit-scrollbar-thumb {
          background: var(--scrollbar-thumb);
          border-radius: 3px;
        }
        .network-toolkit-scroll::-webkit-scrollbar-thumb:hover {
          background: var(--scrollbar-thumb-hover);
        }
        .hover-lift {
          transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1),
                      box-shadow 0.25s ease,
                      border-color 0.25s ease;
        }
        .hover-lift:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        }
        .table-row-hover {
          transition: background 0.15s ease;
        }
        .table-row-hover:hover {
          background: var(--accent-bg);
        }
        .app-input:focus {
          border-color: var(--accent) !important;
          box-shadow: 0 0 0 3px var(--accent-bg);
        }
        .app-button:active {
          transform: scale(0.97);
        }
      `}</style>

      <div
        style={{
          marginBottom: 20,
          animation: 'fadeSlideUp 0.4s ease-out',
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 16,
        }}>
          <div style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: 'linear-gradient(135deg, var(--accent) 0%, #a29bfe 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
          }}>
            <Zap size={22} />
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.2 }}>网络工具箱 Pro</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
              专业级网络诊断工具集
            </div>
          </div>
          <div style={{
            marginLeft: 'auto',
            padding: '6px 12px',
            borderRadius: 20,
            background: 'var(--accent-bg)',
            color: 'var(--accent)',
            fontSize: 11,
            fontWeight: 600,
          }}>
            6 合 1
          </div>
        </div>

        <div style={{
          display: 'flex',
          gap: 4,
          padding: 4,
          borderRadius: 14,
          background: 'var(--glass-bg)',
          border: '1px solid var(--glass-border)',
          backdropFilter: 'blur(10px)',
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                minWidth: 80,
                padding: '10px 12px',
                borderRadius: 10,
                background: activeTab === tab.id
                  ? 'linear-gradient(135deg, var(--accent) 0%, #a29bfe 100%)'
                  : 'transparent',
                color: activeTab === tab.id ? '#fff' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: activeTab === tab.id ? 600 : 500,
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                whiteSpace: 'nowrap',
              }}
              className="tab-button"
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {renderPanel()}
    </div>
  )
})

export default NetworkToolkitPro
