import { useState, useCallback } from 'react'
import {
  Globe, Search, RefreshCw, Copy, Check,
  Server, Hash, Lock, ArrowRightLeft,
  Code2, Layers, AlertTriangle, ChevronRight, Wifi,
} from 'lucide-react'

// ==================== 颜色方案 ====================
const COLORS = {
  bg: '#1a1a2e',
  cardBg: '#0d1117',
  text: '#e6e6e6',
  textMuted: '#8b949e',
  accent: '#7c6cf0',
  border: 'rgba(255,255,255,0.08)',
  success: '#3fb950',
  error: '#f85149',
  warning: '#d29922',
  inputBg: '#161b22',
  hoverBg: 'rgba(124,108,240,0.1)',
}

// ==================== 类型定义 ====================
type TabId = 'ip' | 'dns' | 'http' | 'port' | 'base64' | 'url' | 'json'

interface TabDef {
  id: TabId
  label: string
  icon: typeof Globe
}

const TABS: TabDef[] = [
  { id: 'ip', label: 'IP 查询', icon: Globe },
  { id: 'dns', label: 'DNS 查询', icon: Layers },
  { id: 'http', label: 'HTTP 状态码', icon: Server },
  { id: 'port', label: '端口参考', icon: Hash },
  { id: 'base64', label: 'Base64', icon: Lock },
  { id: 'url', label: 'URL 编解码', icon: ArrowRightLeft },
  { id: 'json', label: 'JSON 格式化', icon: Code2 },
]

// ==================== 常量数据 ====================
const DNS_TYPE_MAP: Record<string, number> = {
  A: 1, AAAA: 28, CNAME: 5, MX: 15, TXT: 16, NS: 2,
}

const HTTP_STATUS_CODES: Array<{ code: number; text: string; category: string; desc: string }> = [
  { code: 100, text: 'Continue', category: '1xx 信息', desc: '服务器已收到请求头，客户端应继续发送请求体' },
  { code: 101, text: 'Switching Protocols', category: '1xx 信息', desc: '服务器将切换到客户端请求的协议' },
  { code: 200, text: 'OK', category: '2xx 成功', desc: '请求成功，GET 请求返回资源，POST 请求返回操作结果' },
  { code: 201, text: 'Created', category: '2xx 成功', desc: '请求成功且服务器创建了新资源' },
  { code: 202, text: 'Accepted', category: '2xx 成功', desc: '请求已接受但尚未处理完成' },
  { code: 204, text: 'No Content', category: '2xx 成功', desc: '请求成功但没有需要返回的内容' },
  { code: 206, text: 'Partial Content', category: '2xx 成功', desc: '服务器成功处理了部分 GET 请求（范围请求）' },
  { code: 301, text: 'Moved Permanently', category: '3xx 重定向', desc: '资源已永久移动到新 URL' },
  { code: 302, text: 'Found', category: '3xx 重定向', desc: '资源临时移动到新 URL' },
  { code: 303, text: 'See Other', category: '3xx 重定向', desc: '应使用 GET 方法从另一个 URI 获取资源' },
  { code: 304, text: 'Not Modified', category: '3xx 重定向', desc: '资源未修改，客户端可使用缓存' },
  { code: 307, text: 'Temporary Redirect', category: '3xx 重定向', desc: '资源临时移动，请求方法不变' },
  { code: 308, text: 'Permanent Redirect', category: '3xx 重定向', desc: '资源永久移动，请求方法不变' },
  { code: 400, text: 'Bad Request', category: '4xx 客户端错误', desc: '请求语法错误，服务器无法理解' },
  { code: 401, text: 'Unauthorized', category: '4xx 客户端错误', desc: '需要身份验证才能访问资源' },
  { code: 403, text: 'Forbidden', category: '4xx 客户端错误', desc: '服务器拒绝请求，权限不足' },
  { code: 404, text: 'Not Found', category: '4xx 客户端错误', desc: '请求的资源不存在' },
  { code: 405, text: 'Method Not Allowed', category: '4xx 客户端错误', desc: '请求方法对目标资源不被允许' },
  { code: 408, text: 'Request Timeout', category: '4xx 客户端错误', desc: '服务器等待请求超时' },
  { code: 409, text: 'Conflict', category: '4xx 客户端错误', desc: '请求与服务器当前状态冲突' },
  { code: 410, text: 'Gone', category: '4xx 客户端错误', desc: '资源已永久删除，不再可用' },
  { code: 413, text: 'Payload Too Large', category: '4xx 客户端错误', desc: '请求体超过服务器限制' },
  { code: 415, text: 'Unsupported Media Type', category: '4xx 客户端错误', desc: '请求的媒体格式不被服务器支持' },
  { code: 422, text: 'Unprocessable Entity', category: '4xx 客户端错误', desc: '请求格式正确但语义错误' },
  { code: 429, text: 'Too Many Requests', category: '4xx 客户端错误', desc: '客户端发送请求过多，触发限流' },
  { code: 500, text: 'Internal Server Error', category: '5xx 服务端错误', desc: '服务器遇到意外错误' },
  { code: 501, text: 'Not Implemented', category: '5xx 服务端错误', desc: '服务器不支持请求的功能' },
  { code: 502, text: 'Bad Gateway', category: '5xx 服务端错误', desc: '网关或代理收到上游无效响应' },
  { code: 503, text: 'Service Unavailable', category: '5xx 服务端错误', desc: '服务器暂时过载或维护中' },
  { code: 504, text: 'Gateway Timeout', category: '5xx 服务端错误', desc: '网关或代理等待上游响应超时' },
]

const PORT_DATA: Array<{ port: number; service: string; protocol: string; desc: string }> = [
  { port: 20, service: 'FTP 数据', protocol: 'TCP', desc: '文件传输协议 - 数据通道' },
  { port: 21, service: 'FTP 控制', protocol: 'TCP', desc: '文件传输协议 - 控制通道' },
  { port: 22, service: 'SSH', protocol: 'TCP', desc: '安全 Shell 远程登录' },
  { port: 23, service: 'Telnet', protocol: 'TCP', desc: '远程登录协议（不安全）' },
  { port: 25, service: 'SMTP', protocol: 'TCP', desc: '简单邮件传输协议' },
  { port: 53, service: 'DNS', protocol: 'TCP/UDP', desc: '域名系统' },
  { port: 67, service: 'DHCP 服务器', protocol: 'UDP', desc: '动态主机配置协议服务器' },
  { port: 68, service: 'DHCP 客户端', protocol: 'UDP', desc: '动态主机配置协议客户端' },
  { port: 69, service: 'TFTP', protocol: 'UDP', desc: '简单文件传输协议' },
  { port: 80, service: 'HTTP', protocol: 'TCP', desc: '超文本传输协议' },
  { port: 110, service: 'POP3', protocol: 'TCP', desc: '邮局协议第3版' },
  { port: 143, service: 'IMAP', protocol: 'TCP', desc: '互联网消息访问协议' },
  { port: 443, service: 'HTTPS', protocol: 'TCP', desc: '超文本传输安全协议' },
  { port: 445, service: 'SMB', protocol: 'TCP', desc: '服务器消息块 / Windows 文件共享' },
  { port: 993, service: 'IMAPS', protocol: 'TCP', desc: 'IMAP over SSL' },
  { port: 995, service: 'POP3S', protocol: 'TCP', desc: 'POP3 over SSL' },
  { port: 1433, service: 'MSSQL', protocol: 'TCP', desc: 'Microsoft SQL Server' },
  { port: 1521, service: 'Oracle', protocol: 'TCP', desc: 'Oracle 数据库' },
  { port: 3306, service: 'MySQL', protocol: 'TCP', desc: 'MySQL 数据库' },
  { port: 3389, service: 'RDP', protocol: 'TCP', desc: '远程桌面协议' },
  { port: 5432, service: 'PostgreSQL', protocol: 'TCP', desc: 'PostgreSQL 数据库' },
  { port: 5672, service: 'AMQP', protocol: 'TCP', desc: 'RabbitMQ 消息队列' },
  { port: 6379, service: 'Redis', protocol: 'TCP', desc: 'Redis 内存数据库' },
  { port: 8080, service: 'HTTP 替代', protocol: 'TCP', desc: '常用 Web 开发/代理端口' },
  { port: 8443, service: 'HTTPS 替代', protocol: 'TCP', desc: '常用 HTTPS 备用端口' },
  { port: 9090, service: 'Prometheus', protocol: 'TCP', desc: 'Prometheus 监控系统' },
  { port: 27017, service: 'MongoDB', protocol: 'TCP', desc: 'MongoDB 文档数据库' },
]

const getCategoryColor = (code: number): string => {
  if (code < 200) return COLORS.textMuted
  if (code < 300) return COLORS.success
  if (code < 400) return COLORS.warning
  if (code < 500) return '#f0883e'
  return COLORS.error
}

// ==================== 内联样式 ====================
const S = {
  root: {
    height: '100%', width: '100%', display: 'flex', flexDirection: 'column',
    background: COLORS.bg, color: COLORS.text,
    fontFamily: "'Noto Sans SC', system-ui, sans-serif", fontSize: 13, overflow: 'hidden',
  } as React.CSSProperties,
  header: {
    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px',
    borderBottom: `1px solid ${COLORS.border}`,
    background: 'linear-gradient(90deg, rgba(124,108,240,0.12) 0%, transparent 60%)',
  } as React.CSSProperties,
  logo: {
    width: 36, height: 36, borderRadius: 12, display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, #7c6cf0 0%, #5b4cd4 100%)',
    boxShadow: '0 6px 20px rgba(124,108,240,0.35)', flexShrink: 0,
  } as React.CSSProperties,
  tabRow: {
    display: 'flex', gap: 2, padding: '6px 16px',
    borderBottom: `1px solid ${COLORS.border}`, overflowX: 'auto',
  } as React.CSSProperties,
  tab: (active: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
    borderRadius: 8, fontSize: 12, fontWeight: 500,
    color: active ? '#fff' : COLORS.textMuted,
    background: active ? 'linear-gradient(135deg, #7c6cf0, #5b4cd4)' : 'transparent',
    border: active ? 'none' : '1px solid transparent',
    cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s', flexShrink: 0,
  }),
  scroll: {
    flex: 1, minHeight: 0, overflowY: 'auto', padding: 16,
  } as React.CSSProperties,
  card: {
    background: COLORS.cardBg, borderRadius: 12,
    border: `1px solid ${COLORS.border}`, marginBottom: 12,
  } as React.CSSProperties,
  cardTitle: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '12px 16px', borderBottom: `1px solid ${COLORS.border}`,
  } as React.CSSProperties,
  cardBody: { padding: 16 } as React.CSSProperties,
  input: {
    width: '100%', padding: '10px 12px', borderRadius: 8,
    border: `1px solid ${COLORS.border}`, background: COLORS.inputBg,
    color: COLORS.text, fontSize: 13, fontFamily: "'JetBrains Mono', monospace",
    outline: 'none', boxSizing: 'border-box' as const,
  } as React.CSSProperties,
  btn: {
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px',
    borderRadius: 8, border: 'none',
    background: 'linear-gradient(135deg, #7c6cf0, #5b4cd4)',
    color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer',
    transition: 'all 0.15s', whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,
  btnDisabled: { opacity: 0.5, cursor: 'not-allowed' } as React.CSSProperties,
  btnSmall: {
    display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px',
    borderRadius: 6, border: `1px solid ${COLORS.border}`,
    background: COLORS.hoverBg, color: COLORS.text, fontSize: 11,
    cursor: 'pointer', transition: 'all 0.15s',
  } as React.CSSProperties,
  codeArea: {
    padding: 12, borderRadius: 8, background: 'rgba(0,0,0,0.3)',
    border: `1px solid ${COLORS.border}`,
    fontFamily: "'JetBrains Mono', monospace", fontSize: 12, lineHeight: 1.7,
    color: '#a5b4fc', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
    overflowX: 'auto', minHeight: 60,
  } as React.CSSProperties,
  select: {
    padding: '10px 12px', borderRadius: 8, border: `1px solid ${COLORS.border}`,
    background: COLORS.inputBg, color: COLORS.text, fontSize: 13,
    cursor: 'pointer', outline: 'none',
  } as React.CSSProperties,
  badge: (color: string): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', padding: '2px 8px',
    borderRadius: 6, fontSize: 11, fontWeight: 600, color,
    background: `${color}18`, border: `1px solid ${color}30`,
  }),
  textarea: {
    width: '100%', minHeight: 120, padding: 12, borderRadius: 8,
    border: `1px solid ${COLORS.border}`, background: COLORS.inputBg,
    color: COLORS.text, fontSize: 12, fontFamily: "'JetBrains Mono', monospace",
    lineHeight: 1.6, resize: 'vertical' as const, outline: 'none',
    boxSizing: 'border-box' as const,
  } as React.CSSProperties,
  errorMsg: {
    padding: '10px 14px', borderRadius: 8, marginTop: 10, fontSize: 12,
    color: COLORS.error, background: 'rgba(248,81,73,0.08)',
    border: '1px solid rgba(248,81,73,0.15)',
  } as React.CSSProperties,
  table: {
    width: '100%', borderCollapse: 'collapse' as const, fontSize: 12,
  } as React.CSSProperties,
  th: {
    padding: '8px 12px', textAlign: 'left' as const, fontSize: 11,
    fontWeight: 600, color: COLORS.textMuted,
    borderBottom: `1px solid ${COLORS.border}`, textTransform: 'uppercase',
    letterSpacing: '0.04em', background: 'rgba(255,255,255,0.02)',
  } as React.CSSProperties,
  td: {
    padding: '7px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)',
    fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
  } as React.CSSProperties,
  footer: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '6px 16px', borderTop: `1px solid ${COLORS.border}`,
    fontSize: 11, color: COLORS.textMuted, flexShrink: 0,
  } as React.CSSProperties,
}

// ==================== 工具函数 ====================
function copyText(text: string): void {
  navigator.clipboard?.writeText(text).catch(() => {})
}

// ==================== 主组件 ====================
export default function NetworkToolkitPro() {
  const [activeTab, setActiveTab] = useState<TabId>('ip')
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  // IP 状态
  const [ipLoading, setIpLoading] = useState(false)
  const [ipData, setIpData] = useState<{ ip: string; location?: Record<string, string> } | null>(null)
  const [ipError, setIpError] = useState<string | null>(null)

  // DNS 状态
  const [dnsDomain, setDnsDomain] = useState('github.com')
  const [dnsType, setDnsType] = useState('A')
  const [dnsLoading, setDnsLoading] = useState(false)
  const [dnsResult, setDnsResult] = useState<Array<{ type: number; TTL: number; data: string; name: string }> | null>(null)
  const [dnsStatus, setDnsStatus] = useState<number | null>(null)
  const [dnsError, setDnsError] = useState<string | null>(null)

  // HTTP 状态码搜索
  const [httpSearch, setHttpSearch] = useState('')
  const [expandedCode, setExpandedCode] = useState<number | null>(null)

  // 端口搜索
  const [portSearch, setPortSearch] = useState('')

  // Base64 状态
  const [b64Input, setB64Input] = useState('')
  const [b64Output, setB64Output] = useState('')
  const [b64Error, setB64Error] = useState<string | null>(null)

  // URL 编解码
  const [urlInput, setUrlInput] = useState('')
  const [urlOutput, setUrlOutput] = useState('')
  const [urlError, setUrlError] = useState<string | null>(null)

  // JSON 状态
  const [jsonInput, setJsonInput] = useState('{\n  "name": "example",\n  "version": 1\n}')
  const [jsonOutput, setJsonOutput] = useState('')
  const [jsonError, setJsonError] = useState<string | null>(null)
  const [jsonValid, setJsonValid] = useState<boolean | null>(null)

  // ==================== 回调：IP 查询 ====================
  const handleIpQuery = useCallback(async () => {
    setIpLoading(true)
    setIpError(null)
    setIpData(null)
    try {
      const res = await fetch('https://api.ipify.org?format=json')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const { ip } = await res.json()
      try {
        const locRes = await fetch(`https://ipapi.co/${ip}/json/`)
        if (locRes.ok) {
          const loc = await locRes.json()
          const location: Record<string, string> = {
            '国家': `${loc.country_name || ''} (${loc.country_code || ''})`,
            '地区': loc.region || '',
            '城市': loc.city || '',
            '邮编': loc.postal || '',
            '纬度': String(loc.latitude ?? ''),
            '经度': String(loc.longitude ?? ''),
            '时区': loc.timezone || '',
            'ISP': loc.org || '',
            'ASN': loc.asn || '',
            '网络': loc.network || '',
          }
          setIpData({ ip, location })
        } else {
          setIpData({ ip })
        }
      } catch {
        setIpData({ ip })
      }
    } catch (e) {
      setIpError(e instanceof Error ? e.message : 'IP 查询失败')
    } finally {
      setIpLoading(false)
    }
  }, [])

  // ==================== 回调：DNS 查询 ====================
  const handleDnsQuery = useCallback(async () => {
    const domain = dnsDomain.trim()
    if (!domain) return
    setDnsLoading(true)
    setDnsError(null)
    setDnsResult(null)
    setDnsStatus(null)
    try {
      const typeNum = DNS_TYPE_MAP[dnsType] || 1
      const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=${typeNum}`
      const res = await fetch(url, { headers: { Accept: 'application/dns-json' } })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setDnsStatus(data.Status ?? -1)
      if (data.Status !== 0) {
        setDnsError(`DNS 查询返回错误码: ${data.Status}`)
      }
      setDnsResult(data.Answer || [])
    } catch (e) {
      setDnsError(e instanceof Error ? e.message : 'DNS 查询失败')
    } finally {
      setDnsLoading(false)
    }
  }, [dnsDomain, dnsType])

  // ==================== 回调：Base64 ====================
  const handleBase64Encode = useCallback(() => {
    setB64Error(null)
    try {
      setB64Output(btoa(unescape(encodeURIComponent(b64Input))))
    } catch {
      setB64Error('Base64 编码失败：输入包含无效字符')
    }
  }, [b64Input])

  const handleBase64Decode = useCallback(() => {
    setB64Error(null)
    try {
      setB64Output(decodeURIComponent(escape(atob(b64Input.trim()))))
    } catch {
      setB64Error('Base64 解码失败：输入不是有效的 Base64 字符串')
    }
  }, [b64Input])

  // ==================== 回调：URL 编解码 ====================
  const handleUrlEncode = useCallback(() => {
    setUrlError(null)
    try { setUrlOutput(encodeURIComponent(urlInput)) } catch { setUrlError('URL 编码失败') }
  }, [urlInput])

  const handleUrlDecode = useCallback(() => {
    setUrlError(null)
    try { setUrlOutput(decodeURIComponent(urlInput)) } catch { setUrlError('URL 解码失败：输入包含无效编码序列') }
  }, [urlInput])

  // ==================== 回调：JSON ====================
  const handleJsonFormat = useCallback(() => {
    setJsonError(null); setJsonValid(null); setJsonOutput('')
    try { setJsonOutput(JSON.stringify(JSON.parse(jsonInput), null, 2)); setJsonValid(true) }
    catch (e) { setJsonValid(false); setJsonError(e instanceof Error ? e.message : 'JSON 解析失败') }
  }, [jsonInput])

  const handleJsonMinify = useCallback(() => {
    setJsonError(null); setJsonValid(null); setJsonOutput('')
    try { setJsonOutput(JSON.stringify(JSON.parse(jsonInput))); setJsonValid(true) }
    catch (e) { setJsonValid(false); setJsonError(e instanceof Error ? e.message : 'JSON 解析失败') }
  }, [jsonInput])

  const handleJsonValidate = useCallback(() => {
    setJsonError(null); setJsonOutput('')
    try { JSON.parse(jsonInput); setJsonValid(true) }
    catch (e) { setJsonValid(false); setJsonError(e instanceof Error ? e.message : 'JSON 解析失败') }
  }, [jsonInput])

  // ==================== 复制 ====================
  const handleCopy = useCallback((text: string, key: string) => {
    copyText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 1500)
  }, [])

  // ==================== 过滤数据 ====================
  const filteredHttpCodes = HTTP_STATUS_CODES.filter(item => {
    if (!httpSearch.trim()) return true
    const q = httpSearch.toLowerCase()
    return String(item.code).includes(q) || item.text.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q)
  })

  const httpGroups = filteredHttpCodes.reduce<Record<string, typeof filteredHttpCodes>>((acc, item) => {
    (acc[item.category] = acc[item.category] || []).push(item)
    return acc
  }, {})

  const filteredPorts = PORT_DATA.filter(item => {
    if (!portSearch.trim()) return true
    const q = portSearch.toLowerCase()
    return String(item.port).includes(q) || item.service.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q)
  })

  // ==================== 卡片头渲染辅助 ====================
  const renderCardHead = (Icon: typeof Globe, title: string, extra?: string) => (
    <div style={S.cardTitle}>
      <div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(124,108,240,0.15)' }}>
        <Icon width={14} height={14} color={COLORS.accent} />
      </div>
      <span style={{ fontWeight: 500 }}>{title}</span>
      {extra && <span style={{ marginLeft: 'auto', fontSize: 11, color: COLORS.textMuted }}>{extra}</span>}
    </div>
  )

  // ==================== 渲染各标签内容 ====================
  const renderContent = () => {
    switch (activeTab) {
      // ----- IP 查询 -----
      case 'ip':
        return (
          <div style={S.card}>
            {renderCardHead(Globe, 'IP 地址信息查询', 'api.ipify.org + ipapi.co')}
            <div style={S.cardBody}>
              <button onClick={handleIpQuery} disabled={ipLoading}
                style={{ ...S.btn, ...(ipLoading ? S.btnDisabled : {}), marginBottom: 14 }}>
                {ipLoading
                  ? <><RefreshCw width={14} height={14} style={{ animation: 'spin 1s linear infinite' }} /> 查询中…</>
                  : <><Search width={14} height={14} /> 查询我的 IP</>}
              </button>
              {ipError && (
                <div style={S.errorMsg}>
                  <AlertTriangle width={12} height={12} style={{ display: 'inline', verticalAlign: -2, marginRight: 6 }} />
                  {ipError}
                </div>
              )}
              {ipData && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, background: 'rgba(124,108,240,0.08)', border: '1px solid rgba(124,108,240,0.15)' }}>
                    <span style={{ fontSize: 12, color: COLORS.textMuted }}>你的 IP</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 15, fontWeight: 600, color: COLORS.accent }}>{ipData.ip}</span>
                    <button onClick={() => handleCopy(ipData.ip, 'ip')} style={{ marginLeft: 'auto', ...S.btnSmall }} title="复制 IP">
                      {copiedKey === 'ip' ? <><Check width={11} height={11} color={COLORS.success} /> 已复制</> : <><Copy width={11} height={11} /> 复制</>}
                    </button>
                  </div>
                  {ipData.location && (
                    <div style={{ borderRadius: 8, border: `1px solid ${COLORS.border}`, overflow: 'hidden' }}>
                      <table style={S.table}>
                        <thead><tr><th style={S.th}>属性</th><th style={S.th}>值</th></tr></thead>
                        <tbody>
                          {Object.entries(ipData.location).map(([k, v]) => v ? (
                            <tr key={k}>
                              <td style={{ ...S.td, color: COLORS.textMuted, fontFamily: 'inherit' }}>{k}</td>
                              <td style={S.td}>{v}</td>
                            </tr>
                          ) : null)}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
              {!ipLoading && !ipData && !ipError && (
                <div style={{ textAlign: 'center', padding: '30px 0', color: COLORS.textMuted, fontSize: 12 }}>
                  点击「查询我的 IP」获取你的公网 IP 地址和位置信息
                </div>
              )}
            </div>
          </div>
        )

      // ----- DNS 查询 -----
      case 'dns':
        return (
          <div style={S.card}>
            {renderCardHead(Layers, 'DNS 记录查询', 'Cloudflare DoH')}
            <div style={S.cardBody}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <input value={dnsDomain} onChange={e => setDnsDomain(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleDnsQuery()}
                  placeholder="输入域名，如 github.com"
                  style={{ ...S.input, flex: 1 }} />
                <select value={dnsType} onChange={e => setDnsType(e.target.value)} style={{ ...S.select, flexShrink: 0 }}>
                  {Object.keys(DNS_TYPE_MAP).map(t => (
                    <option key={t} value={t} style={{ background: COLORS.bg, color: COLORS.text }}>{t}</option>
                  ))}
                </select>
                <button onClick={handleDnsQuery} disabled={dnsLoading}
                  style={{ ...S.btn, ...(dnsLoading ? S.btnDisabled : {}) }}>
                  {dnsLoading
                    ? <><RefreshCw width={14} height={14} style={{ animation: 'spin 1s linear infinite' }} /> 查询中…</>
                    : <><Search width={14} height={14} /> 查询</>}
                </button>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                {['github.com', 'google.com', 'baidu.com', 'cloudflare.com', 'example.com'].map(d => (
                  <button key={d} onClick={() => setDnsDomain(d)} style={S.btnSmall}>
                    <ChevronRight width={10} height={10} />{d}
                  </button>
                ))}
              </div>
              {dnsError && (
                <div style={S.errorMsg}>
                  <AlertTriangle width={12} height={12} style={{ display: 'inline', verticalAlign: -2, marginRight: 6 }} />
                  {dnsError}
                </div>
              )}
              {dnsStatus !== null && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={S.badge(dnsStatus === 0 ? COLORS.success : COLORS.error)}>
                    {dnsStatus === 0 ? '✓ 解析成功' : `✗ RCODE ${dnsStatus}`}
                  </span>
                  {dnsResult && <span style={{ fontSize: 11, color: COLORS.textMuted }}>{dnsResult.length} 条记录</span>}
                </div>
              )}
              {dnsResult && dnsResult.length > 0 && (
                <div style={{ borderRadius: 8, border: `1px solid ${COLORS.border}`, overflow: 'hidden' }}>
                  <table style={S.table}>
                    <thead><tr><th style={S.th}>类型</th><th style={S.th}>名称</th><th style={S.th}>TTL</th><th style={S.th}>值</th></tr></thead>
                    <tbody>
                      {dnsResult.map((r, i) => (
                        <tr key={i}>
                          <td style={S.td}><span style={S.badge(COLORS.accent)}>{Object.entries(DNS_TYPE_MAP).find(([, v]) => v === r.type)?.[0] || r.type}</span></td>
                          <td style={{ ...S.td, color: '#a78bfa' }}>{r.name}</td>
                          <td style={{ ...S.td, color: COLORS.textMuted, textAlign: 'right' }}>{r.TTL}s</td>
                          <td style={{ ...S.td, color: COLORS.success, wordBreak: 'break-all' }}>{r.data}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {!dnsLoading && dnsStatus !== null && dnsResult && dnsResult.length === 0 && (
                <div style={{ padding: 12, fontSize: 12, color: COLORS.textMuted, textAlign: 'center' }}>
                  未找到 {dnsType} 类型的 DNS 记录
                </div>
              )}
            </div>
          </div>
        )

      // ----- HTTP 状态码 -----
      case 'http':
        return (
          <div style={S.card}>
            {renderCardHead(Server, 'HTTP 状态码参考表', `${filteredHttpCodes.length} 条`)}
            <div style={S.cardBody}>
              <input value={httpSearch} onChange={e => setHttpSearch(e.target.value)}
                placeholder="搜索状态码，如 404、Not Found、重定向..."
                style={{ ...S.input, marginBottom: 12 }} />
              {Object.entries(httpGroups).map(([cat, items]) => (
                <div key={cat} style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {cat}
                  </div>
                  <div style={{ borderRadius: 8, border: `1px solid ${COLORS.border}`, overflow: 'hidden' }}>
                    {items.map(item => (
                      <div key={item.code}
                        onClick={() => setExpandedCode(expandedCode === item.code ? null : item.code)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                          borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer',
                          transition: 'background 0.1s',
                          background: expandedCode === item.code ? COLORS.hoverBg : 'transparent',
                        }}>
                        <span style={{
                          display: 'inline-block', minWidth: 42, padding: '2px 6px', borderRadius: 4,
                          fontSize: 12, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace",
                          color: getCategoryColor(item.code), textAlign: 'center',
                          background: `${getCategoryColor(item.code)}12`,
                        }}>
                          {item.code}
                        </span>
                        <span style={{ fontSize: 12, color: COLORS.text, flex: 1 }}>{item.text}</span>
                        {expandedCode === item.code && (
                          <span style={{ fontSize: 11, color: COLORS.textMuted }}>{item.desc}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {filteredHttpCodes.length === 0 && (
                <div style={{ padding: 20, textAlign: 'center', color: COLORS.textMuted, fontSize: 12 }}>
                  没有匹配的状态码
                </div>
              )}
            </div>
          </div>
        )

      // ----- 端口参考 -----
      case 'port':
        return (
          <div style={S.card}>
            {renderCardHead(Hash, '常见端口号参考', `${filteredPorts.length} 条`)}
            <div style={S.cardBody}>
              <input value={portSearch} onChange={e => setPortSearch(e.target.value)}
                placeholder="搜索端口号、服务名或描述，如 3306、MySQL、数据库..."
                style={{ ...S.input, marginBottom: 12 }} />
              <div style={{ borderRadius: 8, border: `1px solid ${COLORS.border}`, overflow: 'hidden' }}>
                <table style={S.table}>
                  <thead>
                    <tr>
                      <th style={S.th}>端口</th>
                      <th style={S.th}>服务</th>
                      <th style={S.th}>协议</th>
                      <th style={S.th}>说明</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPorts.map(item => (
                      <tr key={item.port}>
                        <td style={{ ...S.td, color: COLORS.accent, fontWeight: 600 }}>{item.port}</td>
                        <td style={{ ...S.td, color: COLORS.text, fontFamily: 'inherit' }}>{item.service}</td>
                        <td style={{ ...S.td }}>
                          <span style={S.badge(item.protocol.includes('UDP') ? COLORS.warning : COLORS.success)}>
                            {item.protocol}
                          </span>
                        </td>
                        <td style={{ ...S.td, color: COLORS.textMuted, fontFamily: 'inherit' }}>{item.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredPorts.length === 0 && (
                <div style={{ padding: 20, textAlign: 'center', color: COLORS.textMuted, fontSize: 12 }}>
                  没有匹配的端口
                </div>
              )}
            </div>
          </div>
        )

      // ----- Base64 -----
      case 'base64':
        return (
          <div style={S.card}>
            {renderCardHead(Lock, 'Base64 编解码')}
            <div style={S.cardBody}>
              <div style={{ marginBottom: 8, fontSize: 11, fontWeight: 500, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                输入
              </div>
              <textarea value={b64Input} onChange={e => setB64Input(e.target.value)}
                placeholder="在此输入要编码或解码的文本..."
                style={S.textarea} />
              <div style={{ display: 'flex', gap: 8, margin: '12px 0' }}>
                <button onClick={handleBase64Encode} style={S.btn}>
                  <ArrowRightLeft width={14} height={14} /> 编码 (Text → Base64)
                </button>
                <button onClick={handleBase64Decode} style={{ ...S.btn, background: 'linear-gradient(135deg, #3fb950, #2ea043)' }}>
                  <ArrowRightLeft width={14} height={14} /> 解码 (Base64 → Text)
                </button>
                {b64Output && (
                  <button onClick={() => handleCopy(b64Output, 'b64')} style={S.btnSmall}>
                    {copiedKey === 'b64' ? <><Check width={11} height={11} color={COLORS.success} /> 已复制</> : <><Copy width={11} height={11} /> 复制结果</>}
                  </button>
                )}
              </div>
              {b64Error && (
                <div style={S.errorMsg}>
                  <AlertTriangle width={12} height={12} style={{ display: 'inline', verticalAlign: -2, marginRight: 6 }} />
                  {b64Error}
                </div>
              )}
              {b64Output && (
                <>
                  <div style={{ marginBottom: 8, fontSize: 11, fontWeight: 500, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    输出
                  </div>
                  <div style={S.codeArea}>{b64Output}</div>
                </>
              )}
            </div>
          </div>
        )

      // ----- URL 编解码 -----
      case 'url':
        return (
          <div style={S.card}>
            {renderCardHead(ArrowRightLeft, 'URL 编解码')}
            <div style={S.cardBody}>
              <div style={{ marginBottom: 8, fontSize: 11, fontWeight: 500, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                输入
              </div>
              <textarea value={urlInput} onChange={e => setUrlInput(e.target.value)}
                placeholder="在此输入要编码或解码的 URL/文本..."
                style={{ ...S.textarea, minHeight: 80 }} />
              <div style={{ display: 'flex', gap: 8, margin: '12px 0' }}>
                <button onClick={handleUrlEncode} style={S.btn}>
                  <ArrowRightLeft width={14} height={14} /> 编码 (encodeURIComponent)
                </button>
                <button onClick={handleUrlDecode} style={{ ...S.btn, background: 'linear-gradient(135deg, #3fb950, #2ea043)' }}>
                  <ArrowRightLeft width={14} height={14} /> 解码 (decodeURIComponent)
                </button>
                {urlOutput && (
                  <button onClick={() => handleCopy(urlOutput, 'url')} style={S.btnSmall}>
                    {copiedKey === 'url' ? <><Check width={11} height={11} color={COLORS.success} /> 已复制</> : <><Copy width={11} height={11} /> 复制结果</>}
                  </button>
                )}
              </div>
              {urlError && (
                <div style={S.errorMsg}>
                  <AlertTriangle width={12} height={12} style={{ display: 'inline', verticalAlign: -2, marginRight: 6 }} />
                  {urlError}
                </div>
              )}
              {urlOutput && (
                <>
                  <div style={{ marginBottom: 8, fontSize: 11, fontWeight: 500, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    输出
                  </div>
                  <div style={S.codeArea}>{urlOutput}</div>
                </>
              )}
            </div>
          </div>
        )

      // ----- JSON 格式化 -----
      case 'json':
        return (
          <div style={S.card}>
            {renderCardHead(Code2, 'JSON 格式化 / 验证')}
            <div style={S.cardBody}>
              <div style={{ marginBottom: 8, fontSize: 11, fontWeight: 500, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                输入 JSON
              </div>
              <textarea value={jsonInput} onChange={e => setJsonInput(e.target.value)}
                placeholder='在此输入 JSON 字符串，如 {"key": "value"}'
                style={{ ...S.textarea, minHeight: 100 }} />
              <div style={{ display: 'flex', gap: 8, margin: '12px 0', flexWrap: 'wrap' }}>
                <button onClick={handleJsonFormat} style={S.btn}>
                  <Code2 width={14} height={14} /> 格式化
                </button>
                <button onClick={handleJsonMinify}
                  style={{ ...S.btn, background: 'linear-gradient(135deg, #d29922, #b87d14)' }}>
                  <Code2 width={14} height={14} /> 压缩
                </button>
                <button onClick={handleJsonValidate}
                  style={{ ...S.btn, background: 'linear-gradient(135deg, #3fb950, #2ea043)' }}>
                  <Check width={14} height={14} /> 验证
                </button>
                {jsonOutput && (
                  <button onClick={() => handleCopy(jsonOutput, 'json')} style={S.btnSmall}>
                    {copiedKey === 'json' ? <><Check width={11} height={11} color={COLORS.success} /> 已复制</> : <><Copy width={11} height={11} /> 复制结果</>}
                  </button>
                )}
              </div>
              {jsonValid !== null && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={S.badge(jsonValid ? COLORS.success : COLORS.error)}>
                    {jsonValid ? '✓ JSON 有效' : '✗ JSON 无效'}
                  </span>
                </div>
              )}
              {jsonError && (
                <div style={S.errorMsg}>
                  <AlertTriangle width={12} height={12} style={{ display: 'inline', verticalAlign: -2, marginRight: 6 }} />
                  {jsonError}
                </div>
              )}
              {jsonOutput && (
                <>
                  <div style={{ marginBottom: 8, fontSize: 11, fontWeight: 500, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    输出
                  </div>
                  <div style={S.codeArea}>{jsonOutput}</div>
                </>
              )}
            </div>
          </div>
        )
    }
  }

  // ==================== 主渲染 ====================
  return (
    <div style={S.root}>
      {/* 顶部标题 */}
      <div style={S.header}>
        <div style={S.logo}>
          <Wifi width={18} height={18} color="white" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 600, fontSize: 15, letterSpacing: '-0.01em' }}>Network Toolkit Pro</span>
            <span style={{
              fontSize: 10, padding: '2px 8px', borderRadius: 6,
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              color: COLORS.textMuted,
            }}>网络工具专业版</span>
          </div>
          <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>
            IP 查询 · DNS 查询 · HTTP 状态码 · 端口参考 · Base64 · URL 编解码 · JSON 格式化
          </div>
        </div>
      </div>

      {/* 标签页栏 */}
      <div style={S.tabRow}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={S.tab(activeTab === t.id)}>
            <t.icon width={13} height={13} />
            {t.label}
          </button>
        ))}
      </div>

      {/* 内容区域 */}
      <div style={S.scroll}>
        {renderContent()}
      </div>

      {/* 底部状态栏 */}
      <div style={S.footer}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Globe width={11} height={11} />
            纯前端 · 无后端依赖
          </span>
        </div>
        <span>7 个工具模块 · Cloudflare DoH · React Hooks</span>
      </div>
    </div>
  )
}