import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  CheckCircleIcon, AlertTriangleIcon, ShieldIcon, ActivityIcon,
  GlobeIcon, SearchIcon, RefreshCwIcon, ClockIcon,
  XIcon, InfoIcon, LinkIcon, ServerIcon, LockIcon,
  DatabaseIcon, FileCodeIcon, ChevronUpIcon, CopyIcon, ChevronRightIcon,
  ArrowRightIcon, ZapIcon
} from '../icons'

// ==================== 类型定义 ====================
type Grade = 'A+' | 'A' | 'B' | 'C' | 'D' | 'F'
type Status = 'pass' | 'warn' | 'fail' | 'info' | 'pending' | 'error'
type DnsType = 'A' | 'AAAA' | 'CNAME' | 'MX' | 'NS' | 'TXT' | 'SOA'

interface DnsAnswer {
  name: string
  type: number
  TTL: number
  data: string
}
interface DnsResult {
  ok: boolean
  status: number
  answers: DnsAnswer[]
  rtt: number
  authority?: DnsAnswer[]
  additional?: DnsAnswer[]
  error?: string
}

interface SslCertEntry {
  id: number
  issuer_ca_id?: number
  issuer_name?: string
  common_name?: string
  name_value?: string
  not_before?: string
  not_after?: string
  serial_number?: string
  dns_names?: string[]
}
interface SslResult {
  ok: boolean
  entries: SslCertEntry[]
  latestNotAfter?: Date
  daysLeft?: number
  error?: string
}

interface RdapEvent {
  eventAction: string
  eventDate: string
}
interface RdapResult {
  ok: boolean
  handle?: string
  status?: string[]
  events?: RdapEvent[]
  entities?: { roles?: string[]; vcardArray?: unknown[] }[]
  nameservers?: { ldhName?: string }[]
  registrationDate?: string
  expirationDate?: string
  lastChangedDate?: string
  registrar?: string
  daysLeft?: number
  error?: string
}

interface HealthItem {
  id: string
  label: string
  status: Status
  detail: string
  tip?: string
}

const DNS_TYPE_MAP: Record<DnsType, number> = { A: 1, AAAA: 28, CNAME: 5, MX: 15, NS: 2, TXT: 16, SOA: 6 }
const TYPE_NAME: Record<number, DnsType | string> = Object.fromEntries(Object.entries(DNS_TYPE_MAP).map(([k, v]) => [v, k]))

const SECURITY_HEADERS: { name: string; desc: string; critical: boolean }[] = [
  { name: 'strict-transport-security',       desc: 'HSTS，强制 HTTPS 防止降级攻击', critical: true  },
  { name: 'x-frame-options',                 desc: '禁止被嵌入 iframe，防点击劫持',   critical: true  },
  { name: 'x-content-type-options',          desc: 'nosniff，阻止 MIME 嗅探',          critical: true  },
  { name: 'content-security-policy',         desc: 'CSP，控制资源加载白名单',          critical: true  },
  { name: 'x-xss-protection',                desc: '旧版 XSS 过滤器（现代浏览器建议用 CSP 替代）', critical: false },
  { name: 'referrer-policy',                 desc: 'Referrer 泄露控制',                critical: false },
  { name: 'permissions-policy',              desc: '摄像头/麦克风/定位等特性权限',     critical: false },
]

const GRADE_WEIGHTS: { id: string; max: number; fail?: number; warn?: number }[] = [
  { id: 'http',     max: 15, fail: 15, warn: 5  },
  { id: 'redirect', max: 5,  fail: 5           },
  { id: 'perf',     max: 15, fail: 10, warn: 3  },
  { id: 'headers',  max: 20, fail: 15, warn: 5  },
  { id: 'dns',      max: 10, fail: 6,  warn: 2  },
  { id: 'ssl',      max: 15, fail: 12, warn: 4  },
  { id: 'whois',    max: 10, fail: 5,  warn: 2  },
  { id: 'meta',     max: 10, fail: 5,  warn: 2  },
]

const STORAGE_KEY = 'devops-healthcheck-history-v1'

interface HistoryEntry {
  id: string
  ts: number
  domain: string
  grade: Grade
  score: number
  overallStatus: Status
}

// ==================== 工具函数 ====================
const normalizeDomain = (raw: string): string => {
  let s = raw.trim().toLowerCase()
  if (!s) return ''
  s = s.replace(/^https?:\/\//, '').replace(/^\/+/, '')
  s = s.split('/')[0].split('?')[0].split('#')[0]
  s = s.replace(/:\d+$/, '')
  return s
}

const parseStatusToGrade = (score: number): Grade => {
  if (score >= 95) return 'A+'
  if (score >= 88) return 'A'
  if (score >= 78) return 'B'
  if (score >= 65) return 'C'
  if (score >= 50) return 'D'
  return 'F'
}

const gradeMeta: Record<Grade, { bg: string; text: string; border: string; ring: string }> = {
  'A+': { bg: 'from-emerald-500 to-teal-400',    text: 'text-white', border: 'border-emerald-400/30', ring: 'ring-emerald-400/30' },
  'A':  { bg: 'from-emerald-500 to-green-400',    text: 'text-white', border: 'border-emerald-400/30', ring: 'ring-emerald-400/30' },
  'B':  { bg: 'from-sky-500 to-cyan-400',         text: 'text-white', border: 'border-sky-400/30',     ring: 'ring-sky-400/30'     },
  'C':  { bg: 'from-amber-500 to-yellow-400',     text: 'text-white', border: 'border-amber-400/30',   ring: 'ring-amber-400/30'   },
  'D':  { bg: 'from-orange-500 to-amber-500',     text: 'text-white', border: 'border-orange-400/30',  ring: 'ring-orange-400/30'  },
  'F':  { bg: 'from-rose-600 to-rose-500',        text: 'text-white', border: 'border-rose-400/30',    ring: 'ring-rose-400/30'    },
}

const statusMeta: Record<Status, { Icon: typeof ShieldIcon; className: string; label: string }> = {
  pass:    { Icon: CheckCircleIcon, className: 'text-emerald-400', label: '通过' },
  warn:    { Icon: AlertTriangleIcon, className: 'text-amber-400',   label: '警告' },
  fail:    { Icon: XIcon,      className: 'text-rose-400',    label: '失败' },
  info:    { Icon: InfoIcon,         className: 'text-sky-400',     label: '信息' },
  pending: { Icon: RefreshCwIcon,    className: 'text-slate-400 animate-spin', label: '检查中' },
  error:   { Icon: AlertTriangleIcon,  className: 'text-rose-500',    label: '错误' },
}

function uid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4) }

function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const list = JSON.parse(raw)
    return Array.isArray(list) ? list.slice(0, 40) : []
  } catch { return [] }
}

function saveHistory(list: HistoryEntry[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 40))) } catch {}
}

// ==================== 公开 API 调用（全部合规、CORS 友好） ====================
async function fetchDns(domain: string, type: DnsType = 'A', timeoutMs = 8000): Promise<DnsResult> {
  const start = performance.now()
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=${type}`,
      {
        method: 'GET',
        signal: controller.signal,
        headers: { 'Accept': 'application/dns-json' },
      }
    )
    clearTimeout(timer)
    if (!res.ok) return { ok: false, status: res.status, answers: [], rtt: performance.now() - start, error: `HTTP ${res.status}` }
    const data = await res.json()
    return {
      ok: true,
      status: data.Status ?? 0,
      answers: Array.isArray(data.Answer) ? data.Answer : [],
      authority: Array.isArray(data.Authority) ? data.Authority : [],
      additional: Array.isArray(data.Additional) ? data.Additional : [],
      rtt: performance.now() - start,
    }
  } catch (e) {
    clearTimeout(timer)
    const msg = e instanceof DOMException && e.name === 'AbortError' ? '请求超时' : (e instanceof Error ? e.message : String(e))
    return { ok: false, status: 0, answers: [], rtt: performance.now() - start, error: msg }
  }
}

async function fetchSslCrtsh(domain: string, timeoutMs = 10000): Promise<SslResult> {
  const start = performance.now()
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    // crt.sh Certificate Transparency 公开 JSON 搜索，CORS 支持
    const res = await fetch(
      `https://crt.sh/?q=%25.${encodeURIComponent(domain)}&output=json`,
      { signal: controller.signal, headers: { 'Accept': 'application/json' } }
    )
    clearTimeout(timer)
    if (!res.ok) {
      // crt.sh 有时会限流；退化为仅裸域查询
      const res2 = await fetch(
        `https://crt.sh/?q=${encodeURIComponent(domain)}&output=json`,
        { signal: AbortSignal.timeout(timeoutMs) }
      )
      if (!res2.ok) return { ok: false, entries: [], error: `crt.sh 返回 HTTP ${res2.status || res.status}` }
      const arr2 = await res2.json() as SslCertEntry[]
      return processSsl(arr2, performance.now() - start)
    }
    const arr = await res.json() as SslCertEntry[]
    return processSsl(arr, performance.now() - start)
  } catch (e) {
    clearTimeout(timer)
    return { ok: false, entries: [], error: e instanceof Error ? e.message : String(e) }
  }
}
function processSsl(entries: SslCertEntry[], rtt: number): SslResult {
  if (!Array.isArray(entries)) return { ok: true, entries: [], error: '返回格式异常' }
  // 去重：按 not_after + common_name
  const seen = new Set<string>()
  const list: SslCertEntry[] = []
  for (const e of entries) {
    const key = (e.not_after || '') + '|' + (e.common_name || '') + '|' + (e.serial_number || '')
    if (seen.has(key)) continue
    seen.add(key)
    list.push(e)
  }
  list.sort((a, b) => (b.not_after || '').localeCompare(a.not_after || ''))
  const trimmed = list.slice(0, 6)
  const latest = trimmed[0]
  let daysLeft: number | undefined
  let latestDate: Date | undefined
  if (latest?.not_after) {
    // crt.sh 日期格式：2025-12-31T23:59:59Z 或 YYYYMMDDHHMMSSZ
    let d: Date | undefined
    const s = latest.not_after
    if (/^\d{8}T?\d{6}Z?$/i.test(s)) {
      const year = +s.slice(0, 4); const month = +s.slice(4, 6) - 1; const day = +s.slice(6, 8)
      const hh = +s.slice(9, 11); const mm = +s.slice(11, 13); const ss = +s.slice(13, 15)
      d = new Date(Date.UTC(year, month, day, hh, mm, ss))
    } else {
      const t = Date.parse(s)
      if (!Number.isNaN(t)) d = new Date(t)
    }
    if (d && !Number.isNaN(d.getTime())) {
      latestDate = d
      daysLeft = Math.ceil((d.getTime() - Date.now()) / 86400000)
    }
  }
  void rtt
  return { ok: true, entries: trimmed, latestNotAfter: latestDate, daysLeft }
}

async function fetchRdap(domain: string, timeoutMs = 8000): Promise<RdapResult> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  // rdap.org 是官方 RDAP 聚合网关，CORS 友好
  const tld = domain.split('.').pop()?.toLowerCase()
  try {
    const res = await fetch(`https://rdap.org/domain/${encodeURIComponent(domain)}`, {
      signal: controller.signal,
      headers: { Accept: 'application/rdap+json, application/json' },
    })
    clearTimeout(timer)
    if (!res.ok) {
      // 部分 TLD RDAP 未登记，走开放式 RDAP 备用
      try {
        const res2 = await fetch(`https://www.rdap.net/domain/${encodeURIComponent(domain)}`, {
          signal: AbortSignal.timeout(timeoutMs),
        })
        if (res2.ok) return parseRdap(await res2.json())
      } catch { /* 忽略 */ }
      return { ok: false, error: `RDAP 返回 HTTP ${res.status}（${tld?.toUpperCase()} 顶层域可能暂不支持 RDAP）` }
    }
    return parseRdap(await res.json())
  } catch (e) {
    clearTimeout(timer)
    return { ok: false, error: e instanceof DOMException && e.name === 'AbortError' ? 'RDAP 超时' : (e instanceof Error ? e.message : String(e)) }
  }
}
function parseRdap(data: any): RdapResult {
  const reg = data.events?.find?.((e: RdapEvent) => e.eventAction === 'registration')?.eventDate
  const exp = data.events?.find?.((e: RdapEvent) => e.eventAction === 'expiration')?.eventDate
  const last = data.events?.find?.((e: RdapEvent) => e.eventAction === 'last changed' || e.eventAction === 'last update')?.eventDate
  const regEntity = data.entities?.find?.((x: any) => (x.roles || []).includes('registrar'))
  const extractVcardName = (vcArr: unknown[]): string | undefined => {
    try {
      // vcardArray 格式：["vcard", [ [kind, ...], ["fn", {}, "text", "name"] ]
      for (const row of (vcArr[1] as any[] || [])) {
        if (Array.isArray(row) && row[0] === 'fn') return String(row[3] || '')
      }
    } catch {}
    return undefined
  }
  let registrar = regEntity ? extractVcardName(regEntity.vcardArray || []) : undefined
  if (!registrar && data.registrar) registrar = String(data.registrar)

  let daysLeft: number | undefined
  if (exp) {
    const t = Date.parse(exp)
    if (!Number.isNaN(t)) daysLeft = Math.ceil((t - Date.now()) / 86400000)
  }
  return {
    ok: true,
    handle: data.handle,
    status: Array.isArray(data.status) ? data.status : undefined,
    events: data.events,
    nameservers: data.nameservers,
    entities: data.entities,
    registrationDate: reg,
    expirationDate: exp,
    lastChangedDate: last,
    registrar,
    daysLeft,
  }
}

// ==================== 页面组件 ====================
export default function DevOpsHealthCheck() {
  const [input, setInput] = useState('github.com')
  const [domain, setDomain] = useState('')
  const [scanning, setScanning] = useState(false)
  const [dns, setDns] = useState<Record<DnsType, DnsResult | null>>({ A: null, AAAA: null, CNAME: null, MX: null, NS: null, TXT: null, SOA: null })
  const [ssl, setSsl] = useState<SslResult | null>(null)
  const [rdap, setRdap] = useState<RdapResult | null>(null)

  const [httpStatus, setHttpStatus] = useState<number | null>(null)
  const [httpTiming, setHttpTiming] = useState<{ total?: number; wait?: number } | null>(null)
  const [httpError, setHttpError] = useState<string | null>(null)
  const [httpsRedirect, setHttpsRedirect] = useState<boolean | null>(null)
  const [responseHeaders, setResponseHeaders] = useState<Record<string, string>>({})
  const [headImgEtag, setHeadImgEtag] = useState<{ ok: boolean; code?: number; sizeKB?: number; ttlMs?: number; faviconSizeKB?: number; error?: string } | null>(null)

  const [meta, setMeta] = useState<{ title?: string; description?: string; viewport?: boolean; charset?: boolean } | null>(null)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [history, setHistory] = useState<HistoryEntry[]>(() => loadHistory())
  const [tab, setTab] = useState<'overview' | 'dns' | 'ssl' | 'whois' | 'perf' | 'history'>('overview')

  // 计算总体结果
  const result = useMemo(() => {
    if (!domain) return null
    const items: HealthItem[] = []
    let deductions = 0
    const byId: Record<string, number> = {}

    // 1) HTTP 可用性 (15)
    {
      if (!httpStatus) items.push({ id: 'http', label: 'HTTPS 连通性', status: 'pending', detail: '等待测试结果…' })
      else if (httpStatus >= 200 && httpStatus < 400) {
        items.push({ id: 'http', label: 'HTTPS 连通性', status: 'pass', detail: `返回 HTTP ${httpStatus}` })
        byId['http'] = 0
      } else if (httpStatus >= 400 && httpStatus < 500) {
        items.push({ id: 'http', label: 'HTTPS 连通性', status: 'warn', detail: `返回 HTTP ${httpStatus}（客户端错误，可能是页面本身但 DNS/服务器正常）` })
        byId['http'] = 5
      } else {
        items.push({ id: 'http', label: 'HTTPS 连通性', status: 'fail', detail: `返回 HTTP ${httpStatus}（服务端错误）` + (httpError ? ' · ' + httpError : '') })
        byId['http'] = 15
      }
    }

    // 2) 强制 HTTPS 重定向 (5)
    {
      if (httpsRedirect === null) items.push({ id: 'redirect', label: 'HTTP → HTTPS 强制跳转', status: 'pending', detail: '等待测试结果…' })
      else if (httpsRedirect) {
        items.push({ id: 'redirect', label: 'HTTP → HTTPS 强制跳转', status: 'pass', detail: '访问 HTTP 会被 301/302/307/308 重定向到 HTTPS' })
        byId['redirect'] = 0
      } else {
        items.push({ id: 'redirect', label: 'HTTP → HTTPS 强制跳转', status: 'fail', detail: 'HTTP 端口未做 HTTPS 重定向，用户容易停留在明文连接。', tip: '在服务器端配置 301 到 https://' })
        byId['redirect'] = 5
      }
    }

    // 3) 性能粗略评估 (15) — 使用 1x1 图标加载 RTT + favicon 下载大小
    {
      const ttl = headImgEtag?.ttlMs ?? httpTiming?.total
      if (!ttl && !headImgEtag) items.push({ id: 'perf', label: '初始加载速度', status: 'pending', detail: '等待测试结果…' })
      else if (ttl && ttl < 600) {
        items.push({ id: 'perf', label: '初始加载速度', status: 'pass', detail: `资源 RTT ${Math.round(ttl)}ms，用户感知较快` })
        byId['perf'] = 0
      } else if (ttl && ttl < 1500) {
        items.push({ id: 'perf', label: '初始加载速度', status: 'warn', detail: `资源 RTT ${Math.round(ttl)}ms，中等。可考虑启用 CDN / 缓存 / HTTP/2。` })
        byId['perf'] = 4
      } else if (ttl) {
        items.push({ id: 'perf', label: '初始加载速度', status: 'warn', detail: `资源 RTT ${Math.round(ttl)}ms，偏慢。` })
        byId['perf'] = 8
      } else if (headImgEtag?.ok === false) {
        items.push({ id: 'perf', label: '初始加载速度', status: 'fail', detail: '健康探针无法下载资源：' + (headImgEtag?.error || '网络错误') })
        byId['perf'] = 10
      }
    }

    // 4) 安全响应头 (20)
    {
      let passCount = 0, critMiss = 0, nonCritMiss = 0, hasCsp = false
      for (const h of SECURITY_HEADERS) {
        const present = Object.keys(responseHeaders).some(k => k.toLowerCase() === h.name)
        if (present) { passCount++; if (h.name === 'content-security-policy') hasCsp = true }
        else { if (h.critical) critMiss++; else nonCritMiss++ }
      }
      const obj = responseHeaders && Object.keys(responseHeaders).length > 0
      if (!obj) items.push({ id: 'headers', label: '安全响应头', status: 'pending', detail: '等待响应头检查…' })
      else {
        let status: Status = 'pass'
        if (critMiss >= 2 || !hasCsp) status = 'warn'
        if (critMiss >= 4) status = 'fail'
        items.push({
          id: 'headers', label: `安全响应头（${passCount}/${SECURITY_HEADERS.length}）`,
          status,
          detail: critMiss > 0 || nonCritMiss > 0
            ? `缺失：${SECURITY_HEADERS.filter(h => !Object.keys(responseHeaders).some(k => k.toLowerCase() === h.name)).map(h => h.name).join(', ')}`
            : '所有推荐头部均已配置。',
          tip: '使用 securityheaders.com 或 mozilla observatory 做更深入审计。'
        })
        byId['headers'] = critMiss * 3 + nonCritMiss * 1
      }
    }

    // 5) DNS 健康 (10) — 至少 A / NS 可解析
    {
      const aOK = dns.A?.ok && dns.A.status === 0 && dns.A.answers.length > 0
      const nsOK = dns.NS?.ok && dns.NS.status === 0 && (dns.NS.answers.length + (dns.NS.authority?.length || 0)) > 0
      const soaExists = (dns.SOA?.answers?.length || dns.SOA?.authority?.length || 0) > 0
      if (!dns.A && !dns.NS) items.push({ id: 'dns', label: 'DNS 解析健康', status: 'pending', detail: '等待 Cloudflare 1.1.1.1 DoH 检查…' })
      else if (aOK && nsOK) {
        items.push({ id: 'dns', label: 'DNS 解析健康', status: 'pass', detail: `A 记录 ${dns.A?.answers?.length || 0} 条 / NS 存在${soaExists ? '，SOA 权威存在' : ''}` })
        byId['dns'] = 0
      } else if (aOK) {
        items.push({ id: 'dns', label: 'DNS 解析健康', status: 'warn', detail: 'A 记录正常，但 NS 权威记录未返回。建议检查域名的 Name Server 配置。' })
        byId['dns'] = 3
      } else {
        items.push({ id: 'dns', label: 'DNS 解析健康', status: 'fail', detail: '通过 DoH 无法解析 A 记录：' + (dns.A?.error || `DNS RCODE=${dns.A?.status}`) })
        byId['dns'] = 8
      }
    }

    // 6) SSL/TLS 证书 (15) — 基于 CT 日志 + 有效期
    {
      if (!ssl) items.push({ id: 'ssl', label: 'SSL/TLS 证书（CT 日志）', status: 'pending', detail: '等待 crt.sh 证书透明日志查询…' })
      else if (!ssl.ok || ssl.entries.length === 0) {
        items.push({ id: 'ssl', label: 'SSL/TLS 证书（CT 日志）', status: 'warn', detail: '证书透明日志未查到记录：' + (ssl.error || '该域可能是内部/自签或尚未签发公网证书') })
        byId['ssl'] = 5
      } else if (ssl.daysLeft === undefined) {
        items.push({ id: 'ssl', label: 'SSL/TLS 证书（CT 日志）', status: 'warn', detail: `查到 ${ssl.entries.length} 张签发历史，但无法解析最新有效期。` })
        byId['ssl'] = 4
      } else if (ssl.daysLeft > 30) {
        items.push({ id: 'ssl', label: 'SSL/TLS 证书（CT 日志）', status: 'pass', detail: `最近签发证书还剩 ${ssl.daysLeft} 天到期（${ssl.latestNotAfter?.toISOString().slice(0, 10)}）` })
        byId['ssl'] = ssl.daysLeft < 60 ? 2 : 0
      } else if (ssl.daysLeft > 7) {
        items.push({ id: 'ssl', label: 'SSL/TLS 证书（CT 日志）', status: 'warn', detail: `证书仅余 ${ssl.daysLeft} 天，建议立即申请续签。` })
        byId['ssl'] = 6
      } else {
        items.push({ id: 'ssl', label: 'SSL/TLS 证书（CT 日志）', status: 'fail', detail: `证书还剩 ${ssl.daysLeft} 天！浏览器很快会显示不安全。` })
        byId['ssl'] = 12
      }
    }

    // 7) WHOIS / RDAP 域名注册信息 (10)
    {
      if (!rdap) items.push({ id: 'whois', label: '域名注册与到期（RDAP）', status: 'pending', detail: '等待 rdap.org 域名注册信息查询…' })
      else if (!rdap.ok) {
        items.push({ id: 'whois', label: '域名注册与到期（RDAP）', status: 'info', detail: rdap.error || '无法获取 RDAP 信息（部分 ccTLD 未接入 RDAP）。' })
        byId['whois'] = 0
      } else if (rdap.daysLeft === undefined) {
        items.push({ id: 'whois', label: '域名注册与到期（RDAP）', status: 'info', detail: 'RDAP 返回正常，但未找到到期日期字段。建议到注册商后台核对。' })
        byId['whois'] = 0
      } else if (rdap.daysLeft > 60) {
        items.push({ id: 'whois', label: '域名注册与到期（RDAP）', status: 'pass', detail: `还剩 ${rdap.daysLeft} 天到期，注册商：${rdap.registrar || '未知'}` })
        byId['whois'] = 0
      } else if (rdap.daysLeft > 14) {
        items.push({ id: 'whois', label: '域名注册与到期（RDAP）', status: 'warn', detail: `还剩 ${rdap.daysLeft} 天到期，请尽快续费。` })
        byId['whois'] = 3
      } else {
        items.push({ id: 'whois', label: '域名注册与到期（RDAP）', status: 'fail', detail: `仅剩 ${rdap.daysLeft} 天，忘记续费可能丢失域名！` })
        byId['whois'] = 8
      }
    }

    // 8) 基础元标记 (10)
    {
      if (!meta) items.push({ id: 'meta', label: '基础 SEO / 移动端 meta', status: 'pending', detail: '等待解析页面 meta 信息…' })
      else {
        let miss: string[] = []
        if (!meta.title) miss.push('<title>')
        if (!meta.description) miss.push('description')
        if (!meta.viewport) miss.push('viewport')
        if (!meta.charset) miss.push('<meta charset>')
        if (miss.length === 0) {
          items.push({ id: 'meta', label: '基础 SEO / 移动端 meta', status: 'pass', detail: `所有 4 项基础 meta 存在。title：${(meta.title || '').slice(0, 40)}` })
          byId['meta'] = 0
        } else if (miss.length <= 1) {
          items.push({ id: 'meta', label: '基础 SEO / 移动端 meta', status: 'warn', detail: `缺失：${miss.join(' / ')}` })
          byId['meta'] = 2
        } else {
          items.push({ id: 'meta', label: '基础 SEO / 移动端 meta', status: 'warn', detail: `缺失：${miss.join(' / ')} · 影响 SEO 与移动端渲染。` })
          byId['meta'] = 5
        }
      }
    }

    for (const w of GRADE_WEIGHTS) {
      const d = byId[w.id] || 0
      deductions += Math.min(w.max, d)
    }
    const score = Math.max(0, Math.round(100 - deductions))
    const grade = parseStatusToGrade(score)
    const overallStatus: Status = score >= 80 ? 'pass' : score >= 60 ? 'warn' : 'fail'
    return { items, score, grade, overallStatus, byId }
  }, [domain, httpStatus, httpTiming, httpError, httpsRedirect, responseHeaders, dns, ssl, rdap, meta, headImgEtag])

  // 保存历史
  useEffect(() => {
    if (result && domain) {
      setHistory(list => {
        const next = [{ id: uid(), ts: Date.now(), domain, grade: result.grade, score: result.score, overallStatus: result.overallStatus }, ...list.filter(x => x.domain !== domain)]
        saveHistory(next)
        return next
      })
    }
  }, [result?.score, domain])

  // ==================== 核心扫描流程 ====================
  const scan = useCallback(async () => {
    const d = normalizeDomain(input)
    if (!d) return
    setDomain(d)
    setScanning(true)
    setDns({ A: null, AAAA: null, CNAME: null, MX: null, NS: null, TXT: null, SOA: null })
    setSsl(null); setRdap(null); setHttpStatus(null); setHttpTiming(null); setHttpError(null)
    setHttpsRedirect(null); setResponseHeaders({}); setMeta(null); setHeadImgEtag(null)

    // 1) DNS 并行 — Cloudflare DoH 1.1.1.1
    const dnsPromises: Promise<void>[] = []
    const dnsTypes: DnsType[] = ['A', 'AAAA', 'CNAME', 'MX', 'NS', 'TXT', 'SOA']
    for (const t of dnsTypes) {
      dnsPromises.push(fetchDns(d, t).then(r => setDns(prev => ({ ...prev, [t]: r }))))
    }

    // 2) SSL CT 日志
    const sslPromise = fetchSslCrtsh(d).then(r => setSsl(r))
    // 3) RDAP 域名注册信息
    const rdapPromise = fetchRdap(d).then(r => setRdap(r))

    // 4) 真实 HTTPS 请求：使用 Image + 自定义 URL，绕过 CORS 限制获得时间/状态启发式
    //    由于浏览器跨域，直接 fetch(url) 可能触发 CORS 预检失败；
    //    但我们可以使用 <img> 触发 GET 并加载 /favicon.ico（公开资源通常允许），
    //    再用 no-cors fetch 拿到 Response.type 来判断是否可达，同时得到头部的只读子集。
    const httpsUrl = `https://${d}/`
    const imgUrl = `https://${d}/favicon.ico`

    const httpPromise = (async () => {
      // no-cors fetch 可获取 opaque response 的基本状态（ok=false但可从status观察）
      try {
        const start = performance.now()
        const res = await fetch(httpsUrl, {
          mode: 'no-cors', cache: 'no-store', redirect: 'follow',
          credentials: 'omit',
        })
        const total = performance.now() - start
        // no-cors 下 headers 多为空对象（opaque filtered）；但我们仍可获得 status
        setHttpTiming({ total })
        // no-cors 返回的状态是 "opaque filtered"：Chrome 对 2xx/3xx/4xx 都暴露 0，
        // 所以这里只能判断请求是否"成功发出"。真正的状态码我们通过下面的 probe 再获取。
        // 对于 HTTPS 可达，只要不抛错且 type!=error，就算通过。
        if (res.type !== 'error') {
          setHttpStatus(299)  // 占位，表示 HTTPS 可达
        } else {
          setHttpStatus(0)
          setHttpError('no-cors 请求报告错误类型')
        }
      } catch (e) {
        setHttpStatus(0)
        setHttpError(e instanceof Error ? e.message : String(e))
      }

      // 使用 XHR + HEAD 尝试获取状态码和头（对同源/宽松 CORS 有用，跨域时我们会回退到图片探测）
      try {
        const xhr = new XMLHttpRequest()
        const t0 = performance.now()
        xhr.open('GET', httpsUrl, true)
        xhr.timeout = 8000
        let settled = false
        xhr.onload = () => {
          if (settled) return
          settled = true
          const total = performance.now() - t0
          setHttpTiming({ total })
          // XHR 跨域被拦截时也可能进入 load 但 status=0
          if (xhr.status > 0) {
            setHttpStatus(xhr.status)
            const hdrs: Record<string, string> = {}
            const raw = xhr.getAllResponseHeaders()
            if (raw) {
              for (const line of raw.split(/\r?\n/)) {
                const sep = line.indexOf(':')
                if (sep > 0) hdrs[line.slice(0, sep).trim().toLowerCase()] = line.slice(sep + 1).trim()
              }
              setResponseHeaders(hdrs)
            }
            // 如果 HTML 能拿到一部分，解析 title/meta
            try {
              const txt = xhr.responseText
              if (txt && typeof txt === 'string') parseAndSetMeta(txt)
            } catch {}
          }
        }
        xhr.onerror = () => {
          if (settled) return
          settled = true
          // XHR 失败 → 使用图片探测
          probeWithImage()
        }
        xhr.ontimeout = () => { settled = true; probeWithImage() }
        xhr.send()
      } catch {
        probeWithImage()
      }
    })()

    // 图片探测 favicon：获得加载成功/失败、下载大小、RTT
    function probeWithImage() {
      const img = new Image()
      const t0 = performance.now()
      let done = false
      const finish = (ok: boolean, code?: number, error?: string) => {
        if (done) return
        done = true
        const ttl = performance.now() - t0
        setHeadImgEtag({ ok, code, ttlMs: ttl, error })
        // 图片能加载 → 至少 200
        if (ok && (!httpStatus || httpStatus <= 0)) setHttpStatus(200)
        if (!ok && (!httpStatus || httpStatus >= 200)) {
          // favicon 不存在并不代表站点不可达；设置 info 而非 fail（见下方额外探测）
        }
      }
      img.onload = () => {
        const sizeKB = Math.max(0.2, Math.round(((img.naturalWidth || 16) * (img.naturalHeight || 16) * 4 / 3) / 102.4) / 10)
        finish(true, 200)
        setHeadImgEtag(prev => prev ? { ...prev, faviconSizeKB: sizeKB } : { ok: true, code: 200, faviconSizeKB: sizeKB })
      }
      img.onerror = () => {
        // 再尝试加载站点根路径的图片：/robots.txt（多数站点存在，纯文本）
        const probe2 = new Image()
        const t1 = performance.now()
        probe2.onload = () => finish(true, 200)
        probe2.onerror = () => {
          const ttl = performance.now() - t1
          // 可能 CORS 匿名加载图片被阻断；改用 window.open-like 策略不能用，只能判定为探测受限。
          finish(false, 0, 'favicon/robots.txt 加载失败，可能是站点本身不可达或同源策略阻断了探测。')
          void ttl
        }
        probe2.src = `https://${d}/robots.txt?${Math.random().toString(36).slice(2, 8)}`
      }
      img.src = imgUrl + '?v=' + Math.random().toString(36).slice(2, 8)
    }

    // HTTP → HTTPS 重定向检查：用 Image 加载 http://... 看是否会被浏览器自动升级或 CORS 头
    // 实际上浏览器混合内容会直接阻止；我们用 fetch no-cors 检查请求是否能至少发送成功。
    const redirectPromise = (async () => {
      try {
        const res = await fetch(`http://${d}/`, { mode: 'no-cors', cache: 'no-store', redirect: 'manual' })
        // redirect: manual 下 3xx 会得到 type="opaqueredirect"，说明有重定向
        if (res.type === 'opaqueredirect') setHttpsRedirect(true)
        else if (res.type === 'error') setHttpsRedirect(false)
        else setHttpsRedirect(false) // 直接返回了内容，没有重定向
      } catch {
        // 混合内容被阻止说明浏览器强制跳了 HSTS；也可能是其他原因
        const headCheck = document.createElement('meta')
        void headCheck
        // HSTS 判定：如果 https 已通过且 http 抛异常，假定重定向已存在
        setHttpsRedirect(null) // 设为 info 级
      }
    })()

    await Promise.all([...dnsPromises, sslPromise, rdapPromise, httpPromise, redirectPromise])
    setScanning(false)
  }, [input, httpStatus])

  // 用 favicon 探测 HTTPS 可达（主流程之外的补充）
  const parseAndSetMeta = (html: string) => {
    const doc = new DOMParser().parseFromString(html, 'text/html')
    const title = doc.querySelector('title')?.textContent?.trim() || undefined
    const description = doc.querySelector('meta[name="description"]')?.getAttribute('content')?.trim()
                           || doc.querySelector('meta[property="og:description"]')?.getAttribute('content')?.trim() || undefined
    const viewport = !!doc.querySelector('meta[name="viewport"]')
    const charset = !!doc.querySelector('meta[charset], meta[http-equiv="Content-Type"]')
    setMeta({ title, description, viewport, charset })
  }

  // ============ 渲染辅助 ============
  const toggle = (k: string) => setExpanded(e => ({ ...e, [k]: !e[k] }))

  const SectionCard = ({ id, title, icon, children, badge }: { id: string; title: string; icon: React.ReactNode; children: React.ReactNode; badge?: React.ReactNode }) => (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
      <button onClick={() => toggle(id)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition text-left">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(56,189,248,0.12))' }}>
          {icon}
        </div>
        <div className="text-[13px] font-medium text-slate-100">{title}</div>
        {badge && <div className="ml-2">{badge}</div>}
        <ChevronUpIcon width={14} height={14} className={`ml-auto text-slate-500 transition-transform ${expanded[id] ? '' : '-rotate-90'}`} />
      </button>
      {expanded[id] !== false && <div className="border-t border-white/5">{children}</div>}
    </div>
  )

  const StatusBadge = ({ s, compact = false }: { s: Status; compact?: boolean }) => {
    const m = statusMeta[s]
    const Ico = m.Icon
    return (
      <span className={`inline-flex items-center gap-1 ${compact ? 'text-[11px]' : 'text-[12px]'} ${m.className}`}>
        <Ico width={compact ? 12 : 14} height={compact ? 12 : 14} />
        {compact ? m.label.slice(0, 2) : m.label}
      </span>
    )
  }

  return (
    <div className="h-full w-full flex flex-col text-[13px] text-slate-200"
      style={{
        fontFamily: "'Noto Sans SC', 'JetBrains Mono', system-ui, sans-serif",
        background: 'linear-gradient(180deg, #070a13 0%, #0a0e1a 100%)',
      }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-white/5"
        style={{ background: 'linear-gradient(90deg, rgba(14,165,233,0.08) 0%, rgba(124,58,237,0.05) 50%, transparent 100%)' }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{
          background: 'linear-gradient(135deg, #0ea5e9 0%, #7c3aed 100%)',
          boxShadow: '0 8px 24px rgba(14,165,233,0.28), inset 0 1px 0 rgba(255,255,255,0.18)'
        }}>
          <ActivityIcon width={18} height={18} color="white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold tracking-tight" style={{ fontSize: 15, letterSpacing: '-0.01em' }}>
              DevOps HealthCheck
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">v124 · 站点健康诊断</span>
            <CheckCircleIcon width={12} height={12} className="text-emerald-400/80" />
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Cloudflare DoH · crt.sh 证书透明 · RDAP 域名注册信息 · 安全响应头 · 性能探针 · 纯浏览器，无需后端
          </div>
        </div>
        <button onClick={() => { setHistory([]); saveHistory([]); }} className="text-[11px] px-2.5 py-1 rounded-md border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 transition">清历史</button>
      </div>

      {/* 扫描条 */}
      <div className="px-5 py-3 border-b border-white/5 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[260px]">
          <GlobeIcon width={14} height={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') scan() }}
            placeholder="输入域名：例如 github.com、weibo.com、api.example.com（无需 http://）"
            className="w-full pl-9 pr-16 py-2.5 rounded-xl text-[13px] bg-white/[0.03] border border-white/10 focus:border-sky-500/40 outline-none placeholder:text-slate-600 transition font-mono"
          />
        </div>
        {[
          'github.com', 'google.com', 'baidu.com', 'example.com',
        ].map(d => (
          <button key={d} onClick={() => setInput(d)}
            className="font-mono text-[11px] px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] text-slate-400 hover:text-slate-200 transition">
            {d}
          </button>
        ))}
        <button onClick={scan} disabled={scanning}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-medium text-white shadow-lg shadow-sky-900/20 transition hover:brightness-110 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #7c3aed 100%)' }}>
          {scanning ? <RefreshCwIcon width={14} height={14} className="animate-spin" /> : <SearchIcon width={14} height={14} />}
          {scanning ? '扫描中…' : '开始诊断'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-4 pt-2 border-b border-white/5 overflow-x-auto">
        {[
          { id: 'overview' as const, label: '综合评分', Icon: ShieldIcon },
          { id: 'dns' as const, label: 'DNS 解析', Icon: DatabaseIcon },
          { id: 'ssl' as const, label: 'SSL/TLS', Icon: LockIcon },
          { id: 'whois' as const, label: 'RDAP 域名', Icon: ServerIcon },
          { id: 'perf' as const, label: '响应头 & 性能', Icon: FileCodeIcon },
          { id: 'history' as const, label: '历史记录', Icon: ClockIcon },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-[12px] rounded-t-lg border-b-2 transition shrink-0 ${
              tab === t.id ? 'border-sky-500 text-white bg-white/5' : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}>
            <t.Icon width={13} height={13} />
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {!domain && !scanning && tab === 'overview' && (
          <div className="p-10 text-center max-w-2xl mx-auto">
            <div className="mx-auto w-14 h-14 rounded-2xl mb-4 flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgba(14,165,233,0.2), rgba(124,58,237,0.15))' }}>
              <CheckCircleIcon width={28} height={28} className="text-sky-300" />
            </div>
            <div className="text-[15px] font-semibold mb-2 text-slate-100">站点健康诊断平台</div>
            <div className="text-[12.5px] text-slate-400 leading-6">
              在上方输入任意域名（不要加 https://），我们会从 8 个维度进行体检：HTTPS 可用性、强制跳转、响应速度、
              <strong className="text-slate-200"> 安全响应头</strong>、<strong className="text-slate-200">DNS 解析</strong>（A/AAAA/CNAME/MX/NS/TXT/SOA，基于 Cloudflare 1.1.1.1 DoH JSON 接口）、
              <strong className="text-slate-200">SSL/TLS 证书有效期</strong>（基于 crt.sh 证书透明公开日志）、
              <strong className="text-slate-200">域名 RDAP 注册信息</strong>（rdap.org 官方 RDAP 网关），以及基础 SEO/移动 meta 标记。
              <br />
              所有数据均来自<strong>合规公开 API</strong>，无后端、无本地存储泄露。可在「历史记录」查看过去扫描过的站点。
            </div>
          </div>
        )}

        {tab === 'overview' && result && domain && (
          <div className="p-5 grid grid-cols-1 xl:grid-cols-[280px_1fr] gap-4">
            {/* 评分卡 */}
            <div className="rounded-2xl border border-white/10 p-5 h-fit sticky top-0"
              style={{
                background: 'radial-gradient(ellipse at top, rgba(14,165,233,0.12), transparent 60%), #05070c',
              }}>
              <div className="text-[11px] text-slate-400 mb-1 flex items-center gap-1">
                <LinkIcon width={11} height={11} /> {domain}
              </div>
              <div className="flex items-center gap-4 my-4">
                <div className={`relative w-24 h-24 shrink-0 rounded-2xl bg-gradient-to-br ${gradeMeta[result.grade].bg} flex items-center justify-center shadow-xl`}
                  style={{ boxShadow: '0 16px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)' }}>
                  <div className={`font-black tracking-tight text-white ${result.grade.length === 1 ? 'text-[52px]' : 'text-[44px]'}`} style={{ textShadow: '0 2px 8px rgba(0,0,0,0.25)' }}>
                    {result.grade}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[40px] font-bold leading-none tracking-tight text-slate-100">{result.score}<span className="text-slate-500 text-[18px] font-medium ml-0.5">/100</span></div>
                  <StatusBadge s={result.overallStatus} />
                  <div className="mt-2 text-[11px] text-slate-400 leading-5">
                    <div>{result.items.filter(x => x.status === 'pass').length} 通过 · {result.items.filter(x => x.status === 'warn').length} 警告 · {result.items.filter(x => x.status === 'fail').length} 失败</div>
                  </div>
                </div>
              </div>
              <div className="space-y-2 mt-4">
                {GRADE_WEIGHTS.map(w => {
                  const deduction = Math.min(w.max, result.byId[w.id] || 0)
                  const actual = Math.max(0, w.max - deduction)
                  const pct = Math.round(actual / w.max * 100)
                  return (
                    <div key={w.id}>
                      <div className="flex items-center justify-between text-[11.5px] mb-1">
                        <span className="text-slate-400">
                          {w.id === 'http' ? 'HTTPS 连通' :
                           w.id === 'redirect' ? '强制 HTTPS 跳转' :
                           w.id === 'perf' ? '加载速度' :
                           w.id === 'headers' ? '安全响应头' :
                           w.id === 'dns' ? 'DNS 健康' :
                           w.id === 'ssl' ? 'SSL/TLS' :
                           w.id === 'whois' ? '域名到期' :
                           w.id === 'meta' ? '基础 Meta' : w.id}
                        </span>
                        <span className="text-slate-200 font-mono">{actual}/{w.max}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                        <div className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            background: pct >= 80 ? 'linear-gradient(90deg,#10b981,#22d3ee)' : pct >= 50 ? 'linear-gradient(90deg,#f59e0b,#fb923c)' : 'linear-gradient(90deg,#f43f5e,#f59e0b)'
                          }} />
                      </div>
                    </div>
                  )
                })}
              </div>
              <button onClick={() => scan()}
                className="w-full mt-5 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[12.5px] font-medium text-white transition hover:brightness-110"
                style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #7c3aed 100%)' }}>
                <RefreshCwIcon width={13} height={13} className={scanning ? 'animate-spin' : ''} />
                重新扫描 {domain}
              </button>
            </div>

            {/* 检查项列表 */}
            <div className="space-y-3">
              {result.items.map(it => (
                <div key={it.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4 hover:bg-white/[0.04] transition">
                  <div className="flex items-start gap-3">
                    <StatusBadge s={it.status} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-slate-100">{it.label}</div>
                      <div className="mt-1 text-[12.5px] leading-6 text-slate-400 break-all">{it.detail}</div>
                      {it.tip && (
                        <div className="mt-2 text-[11.5px] leading-5 text-sky-300/90 bg-sky-500/10 border border-sky-500/20 rounded-lg px-3 py-2">
                          💡 {it.tip}
                        </div>
                      )}
                    </div>
                    <ChevronRightIcon width={14} height={14} className="text-slate-600" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'dns' && domain && (
          <div className="p-5 space-y-3">
            {(['A', 'AAAA', 'CNAME', 'MX', 'NS', 'TXT', 'SOA'] as DnsType[]).map(t => {
              const r = dns[t]
              return (
                <SectionCard key={t} id={`dns-${t}`}
                  title={`${t} 记录`}
                  icon={<DatabaseIcon width={15} height={15} className="text-sky-300" />}
                  badge={
                    !r ? <StatusBadge s="pending" compact /> :
                    !r.ok ? <span className="text-[11px] text-rose-400">❌ {r.error}</span> :
                    r.status !== 0 ? <span className="text-[11px] text-amber-400">RCODE {r.status}</span> :
                    <span className="text-[11px] text-emerald-400">
                      ✓ {(r.answers || []).length}条 · {Math.round(r.rtt)}ms
                    </span>
                  }>
                  <div className="px-4 py-3 space-y-1 text-[12px] font-mono">
                    {!r && <div className="text-slate-500">等待查询…</div>}
                    {r && !r.ok && <div className="text-rose-300">查询失败：{r.error}（Cloudflare DoH）</div>}
                    {r && r.ok && (r.answers || []).length === 0 && (r.authority || []).length === 0 && (
                      <div className="text-amber-300">
                        无 {t} 记录（RCODE={r.status}）。空返回通常表示该类型不存在。
                      </div>
                    )}
                    {(r?.answers || []).map((a, i) => (
                      <div key={i} className="flex items-center gap-2 break-all">
                        <span className="text-slate-500 w-10 shrink-0">{TYPE_NAME[a.type] || 'T'+a.type}</span>
                        <span className="text-slate-300 w-16 text-right shrink-0">TTL {a.TTL}</span>
                        <span className="text-violet-200">{a.name}</span>
                        <ChevronRightIcon width={10} height={10} className="text-slate-600 shrink-0" />
                        <span className="text-emerald-300">{a.data}</span>
                      </div>
                    ))}
                    {(r?.answers || []).length === 0 && (r?.authority || []).length > 0 && (
                      <div className="pt-1 text-slate-500 text-[11px]">——— 权威段 (Authority) ———</div>
                    )}
                    {(r?.authority || []).map((a, i) => (
                      <div key={`au-${i}`} className="flex items-center gap-2 break-all">
                        <span className="text-slate-500 w-10 shrink-0">{TYPE_NAME[a.type] || 'T'+a.type}</span>
                        <span className="text-slate-300 w-16 text-right shrink-0">TTL {a.TTL}</span>
                        <span className="text-sky-200">{a.name}</span>
                        <ChevronRightIcon width={10} height={10} className="text-slate-600 shrink-0" />
                        <span className="text-sky-300/90">{a.data}</span>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              )
            })}
          </div>
        )}

        {tab === 'ssl' && domain && (
          <div className="p-5 space-y-3">
            <SectionCard id="ssl-overview"
              title="SSL/TLS 证书有效期（crt.sh 证书透明日志）"
              icon={<LockIcon width={15} height={15} className="text-violet-300" />}
              badge={
                !ssl ? <StatusBadge s="pending" compact /> :
                !ssl.ok ? <span className="text-[11px] text-rose-400">❌ {ssl.error}</span> :
                ssl.entries.length === 0 ? <span className="text-[11px] text-slate-500">未查到证书</span> :
                <span className="text-[11px]">
                  {ssl.daysLeft !== undefined ? (
                    ssl.daysLeft > 30 ? <span className="text-emerald-400">✓ 还剩 {ssl.daysLeft} 天</span> :
                    ssl.daysLeft > 7 ? <span className="text-amber-400">⚠ 剩 {ssl.daysLeft} 天</span> :
                                         <span className="text-rose-400">🔥 剩 {ssl.daysLeft} 天</span>
                  ) : <span className="text-slate-500">无法解析时间</span>}
                  <span className="text-slate-500 ml-2">· {ssl.entries.length} 张历史</span>
                </span>
              }>
              {!ssl ? <div className="px-4 py-3 text-[12px] text-slate-500">正在从 crt.sh 查询公开 CT 日志…</div> :
               !ssl.ok ? <div className="px-4 py-3 text-[12px] text-rose-300">{ssl.error}</div> :
               ssl.entries.length === 0 ? <div className="px-4 py-3 text-[12px] text-slate-500">该域名尚未在 crt.sh 上出现公开签发记录。可能是：内网域名、自签证书、或是刚签发几小时内。</div> : (
                <div className="px-4 py-3 overflow-x-auto">
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr className="text-[11px] text-slate-500 border-b border-white/10">
                        <th className="text-left font-medium py-2 pr-3">#</th>
                        <th className="text-left font-medium py-2 pr-3">CN / SAN</th>
                        <th className="text-left font-medium py-2 pr-3">颁发者</th>
                        <th className="text-left font-medium py-2 pr-3">生效</th>
                        <th className="text-left font-medium py-2 pr-3">到期</th>
                        <th className="text-left font-medium py-2 pr-3">状态</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ssl.entries.map((e, i) => {
                        const expiry = e.not_after
                        let days: number | undefined
                        if (expiry) {
                          let d: Date | undefined
                          if (/^\d{8}T?\d{6}Z?$/i.test(expiry)) {
                            d = new Date(Date.UTC(+expiry.slice(0,4), +expiry.slice(4,6)-1, +expiry.slice(6,8), +expiry.slice(9,11), +expiry.slice(11,13), +expiry.slice(13,15)))
                          } else {
                            const t = Date.parse(expiry)
                            if (!Number.isNaN(t)) d = new Date(t)
                          }
                          if (d && !Number.isNaN(d.getTime())) days = Math.ceil((d.getTime() - Date.now()) / 86400000)
                        }
                        return (
                          <tr key={i} className="border-b border-white/[0.05] hover:bg-white/[0.03]">
                            <td className="py-2 pr-3 text-slate-500">{i + 1}</td>
                            <td className="py-2 pr-3">
                              <div className="font-mono text-violet-200">{e.common_name || '—'}</div>
                              {e.dns_names && e.dns_names.length > 0 && (
                                <div className="text-[10.5px] text-slate-500 mt-0.5">SAN: {e.dns_names.slice(0, 3).join('，')}{e.dns_names.length > 3 ? ` 等 ${e.dns_names.length} 项` : ''}</div>
                              )}
                            </td>
                            <td className="py-2 pr-3 text-[11.5px] text-slate-400 max-w-[240px] truncate">{e.issuer_name || '—'}</td>
                            <td className="py-2 pr-3 font-mono text-slate-300">{e.not_before?.slice(0, 10) || '—'}</td>
                            <td className="py-2 pr-3 font-mono text-slate-300">{e.not_after?.slice(0, 10) || '—'}</td>
                            <td className="py-2 pr-3">
                              {days === undefined ? <span className="text-slate-500 text-[11px]">未知</span> :
                               days > 30 ? <span className="text-emerald-400 text-[11px]">有效</span> :
                               days > 7 ? <span className="text-amber-400 text-[11px]">即将到期 ({days})</span> :
                                          <span className="text-rose-400 text-[11px]">紧急 ({days})</span>}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </SectionCard>
          </div>
        )}

        {tab === 'whois' && domain && (
          <div className="p-5 space-y-3">
            <SectionCard id="rdap-info"
              title="域名注册信息（RDAP，rdap.org 官方网关）"
              icon={<ServerIcon width={15} height={15} className="text-amber-300" />}
              badge={
                !rdap ? <StatusBadge s="pending" compact /> :
                !rdap.ok ? <span className="text-[11px] text-slate-500">⚠ {rdap.error}</span> :
                <span className="text-[11px]">
                  {rdap.daysLeft !== undefined ? (
                    rdap.daysLeft > 60 ? <span className="text-emerald-400">✓ 剩 {rdap.daysLeft} 天到期</span> :
                    rdap.daysLeft > 14 ? <span className="text-amber-400">⚠ 剩 {rdap.daysLeft} 天</span> :
                                         <span className="text-rose-400">🔥 剩 {rdap.daysLeft} 天</span>
                  ) : rdap.handle ? <span className="text-slate-400">Handle: {rdap.handle}</span> : <span className="text-slate-500">返回正常</span>}
                </span>
              }>
              {!rdap ? <div className="px-4 py-3 text-[12px] text-slate-500">正在查询 RDAP…</div> : (
                <div className="px-4 py-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-[12.5px]">
                  <Field label="Handle / ID" value={rdap.handle} />
                  <Field label="注册商" value={rdap.registrar} />
                  <Field label="注册日期" value={rdap.registrationDate} />
                  <Field label="到期日期" value={rdap.expirationDate} highlight={rdap.daysLeft !== undefined && rdap.daysLeft < 60} />
                  <Field label="最近更新" value={rdap.lastChangedDate} />
                  <Field label="状态" value={rdap.status?.join(' · ')} />
                  {rdap.nameservers && rdap.nameservers.length > 0 && (
                    <Field label="Name Servers" value={rdap.nameservers.map(n => n.ldhName).filter(Boolean).join(' · ')} full />
                  )}
                  {!rdap.ok && rdap.error && (
                    <div className="md:col-span-2 text-[12px] text-slate-500 leading-6">
                      ℹ️ RDAP 查询未成功：{rdap.error}。这不影响域名本身的可用性，可能因为该 ccTLD（如 .cn、.co.jp）尚未支持 RDAP 协议，
                      推荐到 <span className="text-sky-400">https://www.whois.com/whois/{domain}</span> 直接查询。
                    </div>
                  )}
                </div>
              )}
            </SectionCard>
          </div>
        )}

        {tab === 'perf' && domain && (
          <div className="p-5 space-y-3">
            <SectionCard id="http-info"
              title="HTTPS 探测 & 性能启发式"
              icon={<ZapIcon width={15} height={15} className="text-amber-300" />}
              badge={
                httpTiming?.total ? <span className="text-[11px] text-emerald-400">RTT {Math.round(httpTiming.total)}ms</span> :
                headImgEtag?.ttlMs ? <span className="text-[11px] text-sky-400">favicon {Math.round(headImgEtag.ttlMs)}ms</span> :
                <StatusBadge s="pending" compact />
              }>
              <div className="px-4 py-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-[12.5px]">
                <KVDark label="HTTP(S) 状态" value={
                  !httpStatus ? '—' : (httpStatus === 299 ? '2xx+ HTTPS 可达 (no-cors)' : `HTTP ${httpStatus}`)
                } accent={httpStatus && httpStatus >= 200 && httpStatus < 400 ? 'ok' : httpStatus ? 'warn' : undefined} />
                <KVDark label="HTTP→HTTPS 重定向" value={
                  httpsRedirect === true ? '存在 (opaqueredirect)' :
                  httpsRedirect === false ? '❌ 缺失' : '浏览器混合内容策略阻止了探测，建议用 curl -I http:// 手动验证'
                } accent={httpsRedirect === true ? 'ok' : httpsRedirect === false ? 'warn' : undefined} />
                <KVDark label="页面 RTT / favicon RTT" value={
                  (httpTiming?.total ? `${Math.round(httpTiming.total)}ms` : '') +
                  (headImgEtag?.ttlMs ? (httpTiming?.total ? ' / ' : '') + `${Math.round(headImgEtag.ttlMs)}ms` : '') ||
                  '测量中…'
                } />
                <KVDark label="favicon 加载" value={
                  headImgEtag === null ? '—' :
                  headImgEtag.ok ? `加载成功${headImgEtag.faviconSizeKB ? `（约 ${headImgEtag.faviconSizeKB}KB）` : ''}` :
                  '失败：' + (headImgEtag.error || '可能不存在')
                } accent={headImgEtag?.ok ? 'ok' : headImgEtag ? 'warn' : undefined} />
                <KVDark label="站点标题" value={meta?.title} full />
                <KVDark label="description" value={meta?.description} full />
                <KVDark label="基础 meta" value={
                  [meta?.viewport && 'viewport', meta?.charset && 'charset'].filter(Boolean).join(' · ') || '未获取'
                } accent={meta?.viewport && meta?.charset ? 'ok' : undefined} />
              </div>
              {httpError && (
                <div className="mx-4 mb-4 text-[12px] text-rose-300 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
                  📡 抓取错误：{httpError}（可能是浏览器 CORS / 混合内容拦截，不代表站点不可达）
                </div>
              )}
            </SectionCard>

            <SectionCard id="resp-headers"
              title={`安全响应头审计（${SECURITY_HEADERS.filter(h => Object.keys(responseHeaders).some(k => k.toLowerCase() === h.name)).length}/${SECURITY_HEADERS.length}）`}
              icon={<FileCodeIcon width={15} height={15} className="text-violet-300" />}
              badge={!Object.keys(responseHeaders).length ? <span className="text-[11px] text-slate-500">XHR 无法拿到（CORS）</span> : <span className="text-[11px] text-emerald-400">可用</span>}>
              {Object.keys(responseHeaders).length === 0 ? (
                <div className="px-4 py-4 text-[12px] text-slate-500 leading-6">
                  ⚠️ 由于跨域 CORS 策略限制，浏览器的 XHR 只能读取一小部分头（Cache-Control、Content-Language、Content-Type、Expires、Last-Modified、Pragma）。
                  要完整审计响应头，请在服务器端执行：<br />
                  <code className="font-mono text-slate-300">curl -I https://{domain}</code>，或使用 <a className="text-sky-400" href="https://securityheaders.com/" target="_blank" rel="noreferrer">securityheaders.com</a> / <a className="text-sky-400" href="https://observatory.mozilla.org/" target="_blank" rel="noreferrer">Mozilla Observatory</a> 做权威评估。
                </div>
              ) : (
                <div className="px-4 py-4 space-y-2 text-[12.5px]">
                  {SECURITY_HEADERS.map(h => {
                    const k = Object.keys(responseHeaders).find(k => k.toLowerCase() === h.name)
                    const present = !!k
                    return (
                      <div key={h.name} className={`flex items-start gap-2 p-3 rounded-lg ${present ? 'bg-emerald-500/[0.07] border border-emerald-500/15' : (h.critical ? 'bg-rose-500/[0.07] border border-rose-500/15' : 'bg-amber-500/[0.07] border border-amber-500/15')}`}>
                        {present ? <CheckCircleIcon width={14} height={14} className="mt-0.5 text-emerald-400 shrink-0" />
                                 : <XIcon width={14} height={14} className={`mt-0.5 shrink-0 ${h.critical ? 'text-rose-400' : 'text-amber-400'}`} />}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-medium" style={{ color: present ? '#34d399' : (h.critical ? '#fb7185' : '#fbbf24') }}>{h.name}</span>
                            {h.critical && <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20">推荐</span>}
                          </div>
                          <div className="mt-0.5 text-[11.5px] text-slate-400">{h.desc}</div>
                          {present && k && (
                            <div className="mt-1 font-mono text-[11px] text-slate-300 break-all">= {(responseHeaders[k] || '').slice(0, 260)}</div>
                          )}
                        </div>
                        <button onClick={() => copy(h.name + ': ' + (k ? responseHeaders[k] : '(缺失，请添加)'), present ? '复制头' : '复制示例')}
                          className="shrink-0 text-slate-500 hover:text-sky-400 transition">
                          <CopyIcon width={12} height={12} />
                        </button>
                      </div>
                    )
                  })}
                  <details className="mt-3">
                    <summary className="cursor-pointer text-[11.5px] text-slate-400 hover:text-slate-200">查看 XHR 实际拿到的全部响应头 ({Object.keys(responseHeaders).length})</summary>
                    <pre className="mt-2 p-3 rounded-lg text-[11px] font-mono leading-6 overflow-x-auto"
                      style={{ background: '#05070c', border: '1px solid rgba(255,255,255,0.06)' }}>
{Object.entries(responseHeaders).map(([k, v]) => `${k}: ${v}`).join('\n')}
                    </pre>
                  </details>
                </div>
              )}
            </SectionCard>
          </div>
        )}

        {tab === 'history' && (
          <div className="p-5">
            {history.length === 0 ? (
              <div className="p-10 text-center text-slate-500 rounded-xl border border-dashed border-white/10">
                暂无扫描历史。在上方输入域名进行第一次诊断吧。
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {history.map(h => {
                  const gm = gradeMeta[h.grade]
                  return (
                    <button key={h.id} onClick={() => { setInput(h.domain); void 0; setDomain(h.domain) /* just open overview */; setTab('overview'); /* 触发扫描可选 */ }}
                      className="group text-left rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20 p-4 transition flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gm.bg} flex items-center justify-center text-white font-black text-[22px] shrink-0`}
                        style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), 0 8px 20px rgba(0,0,0,0.25)' }}>
                        {h.grade}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[13px] text-slate-100 truncate">{h.domain}</span>
                          <ArrowRightIcon width={11} height={11} className="text-slate-600 group-hover:text-slate-400 shrink-0" />
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] font-mono text-slate-300">{h.score}/100</span>
                          <StatusBadge s={h.overallStatus} compact />
                        </div>
                        <div className="text-[10.5px] text-slate-500 mt-0.5">
                          {new Date(h.ts).toLocaleString()}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )

  function copy(text: string, _label: string) {
    if (!text) return
    navigator.clipboard?.writeText(text).catch(() => { /* ignore */ })
  }
}

function Field({ label, value, full, highlight }: { label: string; value?: string; full?: boolean; highlight?: boolean }) {
  return (
    <div className={full ? 'md:col-span-2' : ''}>
      <div className="text-[10.5px] uppercase tracking-wider text-slate-500 mb-1">{label}</div>
      <div className={`font-mono text-[12.5px] break-all ${highlight ? 'text-amber-300' : 'text-slate-200'}`}>{value || '—'}</div>
    </div>
  )
}

function KVDark({ label, value, accent, full }: { label: string; value?: string | number; accent?: 'ok' | 'warn'; full?: boolean }) {
  return (
    <div className={full ? 'md:col-span-3' : ''}>
      <div className="text-[10.5px] uppercase tracking-wider text-slate-500 mb-1">{label}</div>
      <div className={`text-[12.5px] leading-6 break-all ${accent === 'ok' ? 'text-emerald-300' : accent === 'warn' ? 'text-amber-300' : 'text-slate-200'}`}>
        {value || '—'}
      </div>
    </div>
  )
}
