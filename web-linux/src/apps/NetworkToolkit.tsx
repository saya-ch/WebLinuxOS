import { useState, useCallback, memo } from 'react'

type ToolTab = 'ip-geolocation' | 'dns-lookup' | 'http-status' | 'network-speed' | 'headers'

interface GeoResult {
  ip?: string
  version?: string
  city?: string
  region?: string
  country_name?: string
  country_code_iso2?: string
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
}

interface DnsRecord {
  name: string
  type: string
  TTL?: number
  data?: string
  data_pretty?: string
}

const HTTP_STATUS_CODES: Record<number, { name: string; description: string; category: string }> = {
  100: { name: 'Continue', description: '请求者应当继续提出请求', category: '信息响应 (100–199)' },
  101: { name: 'Switching Protocols', description: '请求者已要求服务器切换协议', category: '信息响应 (100–199)' },
  102: { name: 'Processing', description: '服务器已收到并正在处理请求', category: '信息响应 (100–199)' },
  200: { name: 'OK', description: '请求成功', category: '成功响应 (200–299)' },
  201: { name: 'Created', description: '请求已被成功处理，并创建了新的资源', category: '成功响应 (200–299)' },
  202: { name: 'Accepted', description: '请求已被接受，但尚未处理', category: '成功响应 (200–299)' },
  203: { name: 'Non-Authoritative Information', description: '返回的元信息不是来自原始服务器', category: '成功响应 (200–299)' },
  204: { name: 'No Content', description: '请求成功处理，但没有返回任何内容', category: '成功响应 (200–299)' },
  205: { name: 'Reset Content', description: '请求者应当重置文档视图', category: '成功响应 (200–299)' },
  206: { name: 'Partial Content', description: '服务器成功处理了部分 GET 请求', category: '成功响应 (200–299)' },
  300: { name: 'Multiple Choices', description: '存在多种可能的响应', category: '重定向 (300–399)' },
  301: { name: 'Moved Permanently', description: '请求的资源已永久移动', category: '重定向 (300–399)' },
  302: { name: 'Found', description: '请求的资源临时从其他位置响应', category: '重定向 (300–399)' },
  303: { name: 'See Other', description: '对应当使用 GET 方法获取资源', category: '重定向 (300–399)' },
  304: { name: 'Not Modified', description: '资源自上次请求以来未被修改', category: '重定向 (300–399)' },
  307: { name: 'Temporary Redirect', description: '临时重定向', category: '重定向 (300–399)' },
  308: { name: 'Permanent Redirect', description: '永久重定向', category: '重定向 (300–399)' },
  400: { name: 'Bad Request', description: '请求有语法错误或参数错误', category: '客户端错误 (400–499)' },
  401: { name: 'Unauthorized', description: '需要身份验证', category: '客户端错误 (400–499)' },
  402: { name: 'Payment Required', description: '保留将来使用', category: '客户端错误 (400–499)' },
  403: { name: 'Forbidden', description: '服务器拒绝执行请求', category: '客户端错误 (400–499)' },
  404: { name: 'Not Found', description: '请求的资源不存在', category: '客户端错误 (400–499)' },
  405: { name: 'Method Not Allowed', description: '请求方法不被允许', category: '客户端错误 (400–499)' },
  406: { name: 'Not Acceptable', description: '请求的内容特性无法满足', category: '客户端错误 (400–499)' },
  407: { name: 'Proxy Authentication Required', description: '需要代理身份验证', category: '客户端错误 (400–499)' },
  408: { name: 'Request Timeout', description: '请求超时', category: '客户端错误 (400–499)' },
  409: { name: 'Conflict', description: '请求存在冲突', category: '客户端错误 (400–499)' },
  410: { name: 'Gone', description: '资源已永久删除', category: '客户端错误 (400–499)' },
  411: { name: 'Length Required', description: '请求头缺少 Content-Length', category: '客户端错误 (400–499)' },
  412: { name: 'Precondition Failed', description: '前置条件失败', category: '客户端错误 (400–499)' },
  413: { name: 'Payload Too Large', description: '请求体过大', category: '客户端错误 (400–499)' },
  414: { name: 'URI Too Long', description: 'URI 过长', category: '客户端错误 (400–499)' },
  415: { name: 'Unsupported Media Type', description: '不支持的媒体类型', category: '客户端错误 (400–499)' },
  416: { name: 'Range Not Satisfiable', description: '范围无法满足', category: '客户端错误 (400–499)' },
  417: { name: 'Expectation Failed', description: '期望值失败', category: '客户端错误 (400–499)' },
  418: { name: 'I\'m a teapot', description: '我是一个茶壶 (RFC 2324 愚人节玩笑)', category: '客户端错误 (400–499)' },
  421: { name: 'Misdirected Request', description: '请求被错误地定向', category: '客户端错误 (400–499)' },
  422: { name: 'Unprocessable Entity', description: '请求格式正确但语义错误', category: '客户端错误 (400–499)' },
  429: { name: 'Too Many Requests', description: '请求过多 (速率限制)', category: '客户端错误 (400–499)' },
  431: { name: 'Request Header Fields Too Large', description: '请求头字段太大', category: '客户端错误 (400–499)' },
  451: { name: 'Unavailable For Legal Reasons', description: '因法律原因不可用', category: '客户端错误 (400–499)' },
  500: { name: 'Internal Server Error', description: '服务器内部错误', category: '服务器错误 (500–599)' },
  501: { name: 'Not Implemented', description: '服务器不支持该功能', category: '服务器错误 (500–599)' },
  502: { name: 'Bad Gateway', description: '网关错误', category: '服务器错误 (500–599)' },
  503: { name: 'Service Unavailable', description: '服务暂时不可用', category: '服务器错误 (500–599)' },
  504: { name: 'Gateway Timeout', description: '网关超时', category: '服务器错误 (500–599)' },
  505: { name: 'HTTP Version Not Supported', description: '不支持的 HTTP 版本', category: '服务器错误 (500–599)' },
  507: { name: 'Insufficient Storage', description: '存储空间不足', category: '服务器错误 (500–599)' },
  508: { name: 'Loop Detected', description: '检测到循环', category: '服务器错误 (500–599)' },
}

const DNS_TYPES = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SOA', 'PTR']

const NetworkToolkit = memo(function NetworkToolkit() {
  const [activeTab, setActiveTab] = useState<ToolTab>('ip-geolocation')
  const [ipInput, setIpInput] = useState('')
  const [geoResult, setGeoResult] = useState<GeoResult | null>(null)
  const [geoLoading, setGeoLoading] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)

  const [dnsDomain, setDnsDomain] = useState('')
  const [dnsType, setDnsType] = useState('A')
  const [dnsResult, setDnsResult] = useState<DnsRecord[] | null>(null)
  const [dnsLoading, setDnsLoading] = useState(false)
  const [dnsError, setDnsError] = useState<string | null>(null)

  const [statusInput, setStatusInput] = useState<string>('200')
  const [urlCheck, setUrlCheck] = useState('')
  const [urlResult, setUrlResult] = useState<{ status: number; statusText: string; ok: boolean; elapsed: number } | null>(null)
  const [urlLoading, setUrlLoading] = useState(false)
  const [urlError, setUrlError] = useState<string | null>(null)

  const [speedRunning, setSpeedRunning] = useState(false)
  const [speedResult, setSpeedResult] = useState<{ download: number; latency: number } | null>(null)
  const [speedProgress, setSpeedProgress] = useState(0)

  const [headers, setHeaders] = useState<Record<string, string> | null>(null)
  const [headersLoading, setHeadersLoading] = useState(false)
  const [headersUrl, setHeadersUrl] = useState('')
  const [headersError, setHeadersError] = useState<string | null>(null)

  // === IP 地理定位 ===
  const handleGeoLookup = useCallback(async () => {
    setGeoLoading(true)
    setGeoError(null)
    setGeoResult(null)
    try {
      const ipPart = ipInput.trim() ? `/${encodeURIComponent(ipInput.trim())}` : ''
      const res = await fetch(`https://ipapi.co${ipPart}/json/`)
      if (!res.ok) throw new Error(`查询失败: ${res.status}`)
      const data = await res.json()
      if (data.error) throw new Error(data.reason || '查询失败')
      setGeoResult(data)
    } catch (err) {
      setGeoError(err instanceof Error ? err.message : '未知错误')
    } finally {
      setGeoLoading(false)
    }
  }, [ipInput])

  // === DNS 查询 (使用 Cloudflare DNS over HTTPS) ===
  const handleDnsLookup = useCallback(async () => {
    setDnsLoading(true)
    setDnsError(null)
    setDnsResult(null)
    try {
      const domain = dnsDomain.trim().replace(/^https?:\/\//, '').split('/')[0]
      if (!domain) throw new Error('请输入域名')
      const res = await fetch(
        `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=${dnsType}`,
        { headers: { accept: 'application/dns-json' } }
      )
      if (!res.ok) throw new Error(`DNS 查询失败: ${res.status}`)
      const data = await res.json()
      setDnsResult(data.Answer || [])
    } catch (err) {
      setDnsError(err instanceof Error ? err.message : '未知错误')
    } finally {
      setDnsLoading(false)
    }
  }, [dnsDomain, dnsType])

  // === URL 状态码检查 ===
  const handleUrlCheck = useCallback(async () => {
    setUrlLoading(true)
    setUrlError(null)
    setUrlResult(null)
    try {
      let url = urlCheck.trim()
      if (!url) throw new Error('请输入 URL')
      if (!/^https?:\/\//i.test(url)) url = `https://${url}`
      new URL(url)
      const start = performance.now()
      const res = await fetch(url, { method: 'HEAD', mode: 'cors' })
      const elapsed = Math.round(performance.now() - start)
      setUrlResult({ status: res.status, statusText: res.statusText, ok: res.ok, elapsed })
    } catch (err) {
      try {
        let url = urlCheck.trim()
        if (!/^https?:\/\//i.test(url)) url = `https://${url}`
        new URL(url)
        const start = performance.now()
        const res = await fetch(url, { method: 'GET', mode: 'cors' })
        const elapsed = Math.round(performance.now() - start)
        setUrlResult({ status: res.status, statusText: res.statusText, ok: res.ok, elapsed })
      } catch (err2) {
        setUrlError(err2 instanceof Error ? err2.message : '无法连接 (可能是 CORS 限制)')
      }
    } finally {
      setUrlLoading(false)
    }
  }, [urlCheck])

  // === 网络速度测试 ===
  const handleSpeedTest = useCallback(async () => {
    setSpeedRunning(true)
    setSpeedResult(null)
    setSpeedProgress(0)
    try {
      const testUrls = [
        'https://www.cloudflare.com/favicon.ico',
        'https://www.google.com/favicon.ico',
        'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js',
      ]
      let totalTime = 0
      let tests = 0
      let downloadSpeed = 0

      for (let i = 0; i < testUrls.length; i++) {
        try {
          const start = performance.now()
          const res = await fetch(testUrls[i], { cache: 'no-store' })
          const blob = await res.blob()
          const elapsed = (performance.now() - start) / 1000
          if (elapsed > 0 && blob.size > 0) {
            const speedMbps = (blob.size * 8) / (1024 * 1024) / elapsed
            downloadSpeed = Math.max(downloadSpeed, speedMbps)
            totalTime += elapsed
            tests++
          }
          setSpeedProgress(Math.round(((i + 1) / testUrls.length) * 100))
        } catch (_e) { /* 跳过失败的测试 */ }
      }

      setSpeedResult({
        download: downloadSpeed,
        latency: tests > 0 ? Math.round((totalTime / tests) * 1000) : 0,
      })
    } finally {
      setSpeedRunning(false)
    }
  }, [])

  // === 请求头查看 ===
  const handleHeaders = useCallback(async () => {
    setHeadersLoading(true)
    setHeadersError(null)
    setHeaders(null)
    try {
      let url = headersUrl.trim() || 'https://httpbin.org/get'
      if (!/^https?:\/\//i.test(url)) url = `https://${url}`
      new URL(url)
      const res = await fetch(url)
      const hdrs: Record<string, string> = {}
      res.headers.forEach((value, key) => { hdrs[key] = value })
      setHeaders(hdrs)
    } catch (err) {
      setHeadersError(err instanceof Error ? err.message : '请求失败')
    } finally {
      setHeadersLoading(false)
    }
  }, [headersUrl])

  const statusCode = parseInt(statusInput)
  const statusInfo = HTTP_STATUS_CODES[statusCode]

  const tabs: { id: ToolTab; label: string; icon: string }[] = [
    { id: 'ip-geolocation', label: 'IP 地理定位', icon: '🌍' },
    { id: 'dns-lookup', label: 'DNS 查询', icon: '🔍' },
    { id: 'http-status', label: 'HTTP 状态', icon: '📡' },
    { id: 'network-speed', label: '速度测试', icon: '⚡' },
    { id: 'headers', label: '响应头', icon: '📋' },
  ]

  return (
    <div style={{ padding: 20, height: '100%', overflowY: 'auto' }}>
      <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>🛰️</span> 网络工具站
        <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto', fontWeight: 400 }}>
          集成公开 API
        </span>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 16px',
              background: activeTab === tab.id ? 'var(--accent)' : 'transparent',
              color: activeTab === tab.id ? 'white' : 'var(--text)',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500,
              transition: 'all 0.15s',
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* IP 地理定位 */}
      {activeTab === 'ip-geolocation' && (
        <div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
            <input
              type="text"
              placeholder="输入 IP 地址（留空查询本机）"
              value={ipInput}
              onChange={(e) => setIpInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGeoLookup()}
              style={{ flex: 1, padding: '10px 14px', fontSize: 14, background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 6, outline: 'none' }}
            />
            <button
              onClick={handleGeoLookup}
              disabled={geoLoading}
              style={{ padding: '10px 20px', fontSize: 14, background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 6, cursor: geoLoading ? 'wait' : 'pointer', fontWeight: 500 }}
            >
              {geoLoading ? '查询中...' : '查询'}
            </button>
          </div>
          {geoError && (
            <div style={{ padding: 12, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 6, color: '#ef4444', fontSize: 13 }}>{geoError}</div>
          )}
          {geoResult && (
            <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>
                {geoResult.city || geoResult.country_name || geoResult.ip || '未知位置'}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
                {geoResult.region && `${geoResult.region}, `}
                {geoResult.country_name}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                <InfoItem label="IP 地址" value={geoResult.ip} />
                <InfoItem label="版本" value={geoResult.version} />
                <InfoItem label="国家代码" value={geoResult.country_code_iso2} />
                <InfoItem label="首都" value={geoResult.country_capital} />
                <InfoItem label="城市" value={geoResult.city} />
                <InfoItem label="省份" value={geoResult.region} />
                <InfoItem label="邮编" value={geoResult.postal} />
                <InfoItem label="纬度" value={String(geoResult.latitude)} />
                <InfoItem label="经度" value={String(geoResult.longitude)} />
                <InfoItem label="时区" value={geoResult.timezone} />
                <InfoItem label="货币" value={geoResult.currency ? `${geoResult.currency} (${geoResult.currency_symbol})` : undefined} />
                <InfoItem label="ASN" value={geoResult.asn} />
                <InfoItem label="组织" value={geoResult.org} />
                <InfoItem label="ISP" value={geoResult.isp} />
                <InfoItem label="语言" value={geoResult.languages} />
              </div>
              {(geoResult.latitude && geoResult.longitude) && (
                <div style={{ marginTop: 16, fontSize: 12, color: 'var(--text-muted)' }}>
                  坐标: {geoResult.latitude}, {geoResult.longitude}
                </div>
              )}
            </div>
          )}
          {!geoResult && !geoLoading && !geoError && (
            <div style={{ padding: 20, color: 'var(--text-muted)', fontSize: 13 }}>
              输入 IP 地址并点击查询，或留空查询您当前的位置。数据来源：ipapi.co
            </div>
          )}
        </div>
      )}

      {/* DNS 查询 */}
      {activeTab === 'dns-lookup' && (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <input
              type="text"
              placeholder="输入域名（如 example.com）"
              value={dnsDomain}
              onChange={(e) => setDnsDomain(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleDnsLookup()}
              style={{ flex: 1, padding: '10px 14px', fontSize: 14, background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 6, outline: 'none' }}
            />
            <select
              value={dnsType}
              onChange={(e) => setDnsType(e.target.value)}
              style={{ padding: '10px 14px', fontSize: 14, background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 6, outline: 'none' }}
            >
              {DNS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <button
              onClick={handleDnsLookup}
              disabled={dnsLoading}
              style={{ padding: '10px 20px', fontSize: 14, background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 6, cursor: dnsLoading ? 'wait' : 'pointer', fontWeight: 500 }}
            >
              {dnsLoading ? '查询中...' : '查询'}
            </button>
          </div>
          {dnsError && (
            <div style={{ padding: 12, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 6, color: '#ef4444', fontSize: 13 }}>{dnsError}</div>
          )}
          {dnsResult && dnsResult.length > 0 && (
            <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'rgba(0,0,0,0.2)' }}>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600 }}>名称</th>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600 }}>类型</th>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600 }}>TTL</th>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600 }}>数据</th>
                  </tr>
                </thead>
                <tbody>
                  {dnsResult.map((record, idx) => (
                    <tr key={idx} style={{ borderTop: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 16px', fontFamily: 'monospace' }}>{record.name}</td>
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{ padding: '2px 8px', background: 'var(--accent)', color: 'white', borderRadius: 4, fontSize: 11 }}>{record.type}</span>
                      </td>
                      <td style={{ padding: '10px 16px', fontFamily: 'monospace' }}>{record.TTL}</td>
                      <td style={{ padding: '10px 16px', fontFamily: 'monospace', wordBreak: 'break-all' }}>{record.data}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {dnsResult && dnsResult.length === 0 && (
            <div style={{ padding: 20, color: 'var(--text-muted)', fontSize: 13 }}>未找到记录</div>
          )}
          {!dnsResult && !dnsLoading && !dnsError && (
            <div style={{ padding: 20, color: 'var(--text-muted)', fontSize: 13 }}>
              使用 Cloudflare DNS over HTTPS (DoH) 进行安全的 DNS 查询。
            </div>
          )}
        </div>
      )}

      {/* HTTP 状态码 */}
      {activeTab === 'http-status' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, marginBottom: 6, color: 'var(--text-muted)' }}>状态码查询</label>
              <input
                type="number"
                placeholder="输入状态码 (如 404)"
                value={statusInput}
                onChange={(e) => setStatusInput(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', fontSize: 14, background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 6, outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, marginBottom: 6, color: 'var(--text-muted)' }}>URL 检查</label>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type="text"
                  placeholder="example.com"
                  value={urlCheck}
                  onChange={(e) => setUrlCheck(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleUrlCheck()}
                  style={{ flex: 1, padding: '10px 14px', fontSize: 14, background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 6, outline: 'none' }}
                />
                <button onClick={handleUrlCheck} disabled={urlLoading} style={{ padding: '10px 16px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 6, cursor: urlLoading ? 'wait' : 'pointer', fontSize: 14 }}>检查</button>
              </div>
            </div>
          </div>

          {statusInfo && (
            <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: 20, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 12 }}>
                <span style={{ fontSize: 36, fontWeight: 700, color: 'var(--accent)' }}>{statusCode}</span>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 600 }}>{statusInfo.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{statusInfo.category}</div>
                </div>
              </div>
              <div style={{ fontSize: 14, color: 'var(--text)' }}>{statusInfo.description}</div>
            </div>
          )}
          {!statusInfo && (
            <div style={{ padding: 20, color: 'var(--text-muted)', fontSize: 13, background: 'var(--bg-secondary)', borderRadius: 8 }}>
              未找到该状态码。请输入 100-599 之间的标准 HTTP 状态码。
            </div>
          )}

          {urlResult && (
            <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>URL 检查结果</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13 }}>
                <span style={{ padding: '4px 10px', background: urlResult.ok ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: urlResult.ok ? '#22c55e' : '#ef4444', borderRadius: 4 }}>
                  {urlResult.status} {urlResult.statusText || (urlResult.ok ? '成功' : '错误')}
                </span>
                <span style={{ color: 'var(--text-muted)' }}>耗时: {urlResult.elapsed} ms</span>
              </div>
            </div>
          )}
          {urlError && (
            <div style={{ padding: 12, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 6, color: '#ef4444', fontSize: 13, marginTop: 10 }}>{urlError}</div>
          )}
        </div>
      )}

      {/* 网络速度测试 */}
      {activeTab === 'network-speed' && (
        <div>
          <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: 24, textAlign: 'center', marginBottom: 16 }}>
            {speedResult ? (
              <div>
                <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 8 }}>下载速度</div>
                <div style={{ fontSize: 48, fontWeight: 700, color: 'var(--accent)', lineHeight: 1 }}>
                  {speedResult.download.toFixed(2)}
                  <span style={{ fontSize: 18, fontWeight: 500, marginLeft: 4 }}>Mbps</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 12 }}>
                  延迟: ~{speedResult.latency} ms
                </div>
              </div>
            ) : speedRunning ? (
              <div>
                <div style={{ fontSize: 32, marginBottom: 12 }}>⚡</div>
                <div style={{ fontSize: 16, marginBottom: 12 }}>测试中... {speedProgress}%</div>
                <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden', maxWidth: 300, margin: '0 auto' }}>
                  <div style={{ width: `${speedProgress}%`, height: '100%', background: 'var(--accent)', transition: 'width 0.3s' }}></div>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🌐</div>
                <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>
                  点击下方按钮开始测试网络速度
                </div>
              </div>
            )}
          </div>
          <button
            onClick={handleSpeedTest}
            disabled={speedRunning}
            style={{ width: '100%', padding: '14px 20px', fontSize: 15, background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 8, cursor: speedRunning ? 'wait' : 'pointer', fontWeight: 500 }}
          >
            {speedRunning ? '测试中...' : speedResult ? '重新测试' : '开始速度测试'}
          </button>
          <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
            测试结果仅供参考，实际速度可能因网络状况而异
          </div>
        </div>
      )}

      {/* 响应头 */}
      {activeTab === 'headers' && (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <input
              type="text"
              placeholder="输入 URL（默认为 httpbin.org）"
              value={headersUrl}
              onChange={(e) => setHeadersUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleHeaders()}
              style={{ flex: 1, padding: '10px 14px', fontSize: 14, background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 6, outline: 'none' }}
            />
            <button
              onClick={handleHeaders}
              disabled={headersLoading}
              style={{ padding: '10px 20px', fontSize: 14, background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 6, cursor: headersLoading ? 'wait' : 'pointer', fontWeight: 500 }}
            >
              {headersLoading ? '查询中...' : '查看'}
            </button>
          </div>
          {headersError && (
            <div style={{ padding: 12, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 6, color: '#ef4444', fontSize: 13 }}>{headersError}</div>
          )}
          {headers && (
            <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: 16 }}>
              {Object.entries(headers).map(([key, value]) => (
                <div key={key} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', display: 'flex', gap: 12, fontSize: 13 }}>
                  <span style={{ color: 'var(--accent)', minWidth: 180, fontFamily: 'monospace' }}>{key}</span>
                  <span style={{ color: 'var(--text)', wordBreak: 'break-all', fontFamily: 'monospace' }}>{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
})

function InfoItem({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 500 }}>{value}</div>
    </div>
  )
}

export default NetworkToolkit
