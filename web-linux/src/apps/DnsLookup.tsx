import { useState, useCallback, useMemo } from 'react'

interface DnsAnswer {
  name: string
  type: number
  typeName: string
  TTL: number
  data: string
}

interface DnsResponse {
  Status: number
  TC: boolean
  RD: boolean
  RA: boolean
  AD: boolean
  CD: boolean
  Question: { name: string; type: number }[]
  Answer?: DnsAnswer[]
  Authority?: DnsAnswer[]
}

const RECORD_TYPES: { type: number; name: string; desc: string }[] = [
  { type: 1, name: 'A', desc: 'IPv4 地址' },
  { type: 28, name: 'AAAA', desc: 'IPv6 地址' },
  { type: 5, name: 'CNAME', desc: '别名' },
  { type: 15, name: 'MX', desc: '邮件交换' },
  { type: 16, name: 'TXT', desc: '文本记录' },
  { type: 2, name: 'NS', desc: '名称服务器' },
  { type: 6, name: 'SOA', desc: '起始授权' },
  { type: 12, name: 'PTR', desc: '指针（反向）' },
  { type: 33, name: 'SRV', desc: '服务位置' },
  { type: 43, name: 'DS', desc: 'DS 记录' },
  { type: 48, name: 'DNSKEY', desc: 'DNS 密钥' },
  { type: 52, name: 'TLSA', desc: 'TLSA 证书关联' },
  { type: 255, name: 'ANY', desc: '全部记录' },
]

const RCODE_DESC: Record<number, string> = {
  0: 'NoError - 查询成功',
  1: 'FormErr - 格式错误',
  2: 'ServFail - 服务器失败',
  3: 'NXDomain - 域名不存在',
  4: 'NotImp - 未实现',
  5: 'Refused - 被拒绝',
}

function getTypeName(type: number): string {
  return RECORD_TYPES.find((r) => r.type === type)?.name || `TYPE${type}`
}

function isValidDomain(s: string): boolean {
  if (!s || s.length > 253) return false
  const re = /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/
  return re.test(s)
}

function isValidIp(s: string): boolean {
  // IPv4
  const v4 = /^(\d{1,3}\.){3}\d{1,3}$/
  if (v4.test(s)) {
    return s.split('.').every((n) => parseInt(n, 10) >= 0 && parseInt(n, 10) <= 255)
  }
  // IPv6 (simplified)
  if (/^[0-9a-fA-F:]+$/.test(s) && s.split(':').length >= 3) return true
  return false
}

const DnsLookup = () => {
  const [tab, setTab] = useState<'dns' | 'ip' | 'whois' | 'tools'>('dns')
  const [domain, setDomain] = useState('github.com')
  const [recordType, setRecordType] = useState(1)
  const [result, setResult] = useState<DnsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<{ q: string; type: number; ok: boolean; t: number }[]>([])

  // IP 查找
  const [ipQuery, setIpQuery] = useState('')
  const [ipInfo, setIpInfo] = useState<any>(null)
  const [ipLoading, setIpLoading] = useState(false)
  const [ipError, setIpError] = useState<string | null>(null)

  // WHOIS
  const [whoisQuery, setWhoisQuery] = useState('')
  const [whoisResult, setWhoisResult] = useState<string | null>(null)
  const [whoisLoading, setWhoisLoading] = useState(false)
  const [whoisError, setWhoisError] = useState<string | null>(null)

  const doQuery = useCallback(async () => {
    const q = domain.trim().toLowerCase()
    if (!q) {
      setError('请输入查询内容')
      return
    }
    let queryName = q
    let queryType = recordType
    // 若用户输入的是 IP，自动转换为 PTR 查询
    if (isValidIp(q) && recordType !== 12) {
      queryType = 12
      if (/^\d{1,3}(\.\d{1,3}){3}$/.test(q)) {
        queryName = q.split('.').reverse().join('.') + '.in-addr.arpa'
      } else {
        // IPv6 PTR: 扩展为 32 位十六进制后 reverse 并加 ip6.arpa
        const expanded = q.split(':').reduce<string[]>((acc, part) => {
          if (part === '') {
            const missing = 8 - q.split(':').filter((x) => x !== '').length
            for (let i = 0; i < missing; i++) acc.push('0000')
          } else {
            acc.push(part.padStart(4, '0'))
          }
          return acc
        }, []).join('')
        queryName = expanded.split('').reverse().join('.') + '.ip6.arpa'
      }
    } else if (!isValidDomain(q) && !q.endsWith('.arpa') && !/^[a-zA-Z0-9._-]+$/.test(q)) {
      setError('请输入有效的域名或 IP 地址')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const url = `https://dns.google/resolve?name=${encodeURIComponent(queryName)}&type=${queryType}`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: DnsResponse = await res.json()
      setResult(data)
      setHistory((h) => [{ q, type: queryType, ok: data.Status === 0, t: Date.now() }, ...h].slice(0, 10))
    } catch (e) {
      console.error('DNS query error:', e)
      setError('查询失败，请检查网络或输入的内容')
    } finally {
      setLoading(false)
    }
  }, [domain, recordType])

  const doIpLookup = useCallback(async () => {
    const q = ipQuery.trim()
    if (!q) {
      setIpError('请输入 IP 地址或留空查询本机 IP')
      return
    }
    if (q && !isValidIp(q)) {
      setIpError('请输入有效的 IP 地址（IPv4 或 IPv6）')
      return
    }
    setIpLoading(true)
    setIpError(null)
    setIpInfo(null)
    try {
      // ipapi.co 是一个免费公开的 IP 地理定位 API
      const url = q ? `https://ipapi.co/${encodeURIComponent(q)}/json/` : 'https://ipapi.co/json/'
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (data.error) throw new Error(data.reason || '查询失败')
      setIpInfo(data)
    } catch (e) {
      console.error('IP query error:', e)
      setIpError('查询失败 - 该 API 限制速率或 IP 格式错误')
    } finally {
      setIpLoading(false)
    }
  }, [ipQuery])

  const doWhois = useCallback(async () => {
    const q = whoisQuery.trim().toLowerCase()
    if (!q) {
      setWhoisError('请输入域名')
      return
    }
    if (!isValidDomain(q)) {
      setWhoisError('请输入有效的域名')
      return
    }
    setWhoisLoading(true)
    setWhoisError(null)
    setWhoisResult(null)
    try {
      // rdap.org 提供公开的 RDAP（WHOIS 替代）查询
      const rdapUrl = `https://rdap.org/domain/${encodeURIComponent(q)}`
      const res = await fetch(rdapUrl)
      if (!res.ok) {
        // 尝试 whois.arin.net 的 REST 版本
        const alt = await fetch(`https://rdap.verisign.com/com/v1/domain/${encodeURIComponent(q)}`)
        if (alt.ok) {
          const data = await alt.json()
          setWhoisResult(JSON.stringify(data, null, 2))
          return
        }
        throw new Error(`HTTP ${res.status}`)
      }
      const data = await res.json()
      setWhoisResult(JSON.stringify(data, null, 2))
    } catch (e) {
      console.error('WHOIS error:', e)
      // 回退到 whois 格式提示
      setWhoisResult(
        '无法通过 RDAP 获取信息。\n\n您可以手动访问以下服务：\n- https://lookup.icann.org/\n- https://www.whois.com/whois/' + encodeURIComponent(q)
      )
    } finally {
      setWhoisLoading(false)
    }
  }, [whoisQuery])

  // ========== UI ==========
  return (
    <div style={{
      height: '100%',
      background: 'linear-gradient(135deg, #18181b 0%, #1e1b4b 50%, #0f172a 100%)',
      color: '#f4f4f5',
      overflow: 'auto',
      boxSizing: 'border-box',
    }}>
      <div style={{ padding: 20 }}>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
          🌐 网络工具箱
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 16 }}>
          基于 Google Public DNS (DoH) · ipapi.co · rdap.org — 真实 API 查询
        </div>

        <div style={{
          display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          paddingBottom: 12,
        }}>
          {([
            ['dns', '📡 DNS 查询'],
            ['ip', '📍 IP 地理定位'],
            ['whois', '📋 域名 WHOIS'],
            ['tools', '🧰 小工具'],
          ] as const).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              style={{
                padding: '8px 14px',
                background: tab === k ? 'rgba(168,85,247,0.25)' : 'rgba(255,255,255,0.04)',
                color: tab === k ? '#e9d5ff' : '#f4f4f5',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'dns' && (
          <>
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px auto', gap: 10, alignItems: 'end' }}>
                <div>
                  <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', display: 'block', marginBottom: 4 }}>
                    域名或 IP（输入 IP 会自动转为 PTR 反向查询）
                  </label>
                  <input
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && doQuery()}
                    placeholder="github.com 或 8.8.8.8"
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      padding: '10px 12px',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: 8,
                      color: '#fff', fontSize: 13, outline: 'none',
                      fontFamily: 'monospace',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', display: 'block', marginBottom: 4 }}>记录类型</label>
                  <select
                    value={recordType}
                    onChange={(e) => setRecordType(parseInt(e.target.value, 10))}
                    style={{
                      width: '100%', padding: '10px 8px',
                      background: 'rgba(0,0,0,0.3)', color: '#fff',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: 8, fontSize: 13, outline: 'none',
                    }}
                  >
                    {RECORD_TYPES.map((r) => (
                      <option key={r.type} value={r.type} style={{ background: '#1e1b4b', color: '#fff' }}>
                        {r.name} - {r.desc}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={doQuery}
                  disabled={loading}
                  style={{
                    padding: '10px 20px',
                    background: loading ? 'rgba(168,85,247,0.15)' : 'rgba(168,85,247,0.3)',
                    color: '#f5d0fe',
                    border: '1px solid rgba(168,85,247,0.4)',
                    borderRadius: 8,
                    fontSize: 13, fontWeight: 600,
                    cursor: loading ? 'wait' : 'pointer',
                    transition: 'background 0.2s',
                  }}
                >
                  {loading ? '查询中...' : '🔍 查询'}
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                padding: 12, borderRadius: 8, fontSize: 13, color: '#fca5a5', marginBottom: 16,
              }}>
                ⚠️ {error}
              </div>
            )}

            {result && <DnsResultView result={result} />}

            {!result && !error && !loading && <EmptyHint kind="dns" />}
          </>
        )}

        {tab === 'ip' && (
          <>
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12,
              padding: 16, marginBottom: 16,
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'end' }}>
                <div>
                  <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', display: 'block', marginBottom: 4 }}>
                    IP 地址（留空查询本机）
                  </label>
                  <input
                    value={ipQuery}
                    onChange={(e) => setIpQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && doIpLookup()}
                    placeholder="8.8.8.8 或 2001:4860:4860::8888"
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      padding: '10px 12px',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: 8,
                      color: '#fff', fontSize: 13, outline: 'none',
                      fontFamily: 'monospace',
                    }}
                  />
                </div>
                <button
                  onClick={doIpLookup}
                  disabled={ipLoading}
                  style={{
                    padding: '10px 20px',
                    background: ipLoading ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.35)',
                    color: '#dbeafe',
                    border: '1px solid rgba(59,130,246,0.4)',
                    borderRadius: 8,
                    fontSize: 13, fontWeight: 600,
                    cursor: ipLoading ? 'wait' : 'pointer',
                  }}
                >
                  {ipLoading ? '查询中...' : '📍 查询'}
                </button>
              </div>
            </div>

            {ipError && (
              <div style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                padding: 12, borderRadius: 8, fontSize: 13, color: '#fca5a5', marginBottom: 16,
              }}>
                ⚠️ {ipError}
              </div>
            )}

            {ipInfo && <IpInfoView info={ipInfo} />}
            {!ipInfo && !ipError && !ipLoading && <EmptyHint kind="ip" />}
          </>
        )}

        {tab === 'whois' && (
          <>
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12,
              padding: 16, marginBottom: 16,
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'end' }}>
                <div>
                  <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', display: 'block', marginBottom: 4 }}>
                    域名（例如 github.com）
                  </label>
                  <input
                    value={whoisQuery}
                    onChange={(e) => setWhoisQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && doWhois()}
                    placeholder="github.com"
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      padding: '10px 12px',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: 8,
                      color: '#fff', fontSize: 13, outline: 'none',
                      fontFamily: 'monospace',
                    }}
                  />
                </div>
                <button
                  onClick={doWhois}
                  disabled={whoisLoading}
                  style={{
                    padding: '10px 20px',
                    background: whoisLoading ? 'rgba(34,197,94,0.2)' : 'rgba(34,197,94,0.35)',
                    color: '#dcfce7',
                    border: '1px solid rgba(34,197,94,0.4)',
                    borderRadius: 8,
                    fontSize: 13, fontWeight: 600,
                    cursor: whoisLoading ? 'wait' : 'pointer',
                  }}
                >
                  {whoisLoading ? '查询中...' : '📋 查询'}
                </button>
              </div>
            </div>

            {whoisError && (
              <div style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                padding: 12, borderRadius: 8, fontSize: 13, color: '#fca5a5', marginBottom: 16,
              }}>
                ⚠️ {whoisError}
              </div>
            )}

            {whoisResult && (
              <pre style={{
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.08)',
                padding: 16,
                borderRadius: 10,
                fontSize: 12,
                fontFamily: 'monospace',
                color: '#d4d4d8',
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                maxHeight: 600,
              }}>
                {whoisResult}
              </pre>
            )}

            {!whoisResult && !whoisError && !whoisLoading && <EmptyHint kind="whois" />}
          </>
        )}

        {tab === 'tools' && <QuickTools history={history} />}
      </div>
    </div>
  )
}

function EmptyHint({ kind }: { kind: 'dns' | 'ip' | 'whois' }) {
  const hints: Record<string, string[]> = {
    dns: [
      '输入域名（如 github.com）和记录类型进行 DNS 查询',
      'A: IPv4 地址',
      'AAAA: IPv6 地址',
      'MX: 邮件服务器',
      'TXT: SPF/DKIM/DMARC 文本',
      'NS: 名称服务器',
      '输入 IP 会自动执行 PTR 反向查询',
    ],
    ip: [
      '输入 IP 地址查看地理位置、网络供应商、时区等信息',
      '留空则查询本机出口 IP',
      '支持 IPv4 和 IPv6',
    ],
    whois: [
      '输入域名查询注册信息（注册商、注册日期、DNS 等）',
      '数据来源：RDAP (Registration Data Access Protocol)',
      'WHOIS 信息对排查域名问题很有用',
    ],
  }
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 12,
      padding: 20,
    }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: '#e4e4e7' }}>💡 使用提示</div>
      <ul style={{ margin: 0, paddingLeft: 20, color: 'rgba(255,255,255,0.7)', fontSize: 12, lineHeight: 1.8 }}>
        {hints[kind].map((h, i) => (
          <li key={i}>{h}</li>
        ))}
      </ul>
    </div>
  )
}

function DnsResultView({ result }: { result: DnsResponse }) {
  const status = result.Status
  const ok = status === 0
  const answers = result.Answer || []
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 12,
      padding: 16, marginBottom: 16,
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14,
        flexWrap: 'wrap', gap: 8,
      }}>
        <div style={{
          padding: '4px 10px',
          background: ok ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
          color: ok ? '#86efac' : '#fca5a5',
          borderRadius: 6, fontSize: 12, fontWeight: 600,
          border: `1px solid ${ok ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`,
        }}>
          状态: {RCODE_DESC[status] || `RCODE=${status}`}
        </div>
        <div style={{
          display: 'flex', gap: 6, fontSize: 11, color: 'rgba(255,255,255,0.6)',
        }}>
          {[
            ['RA', result.RA], ['AD', result.AD], ['TC', result.TC], ['RD', result.RD],
          ].map(([k, v]) => (
            <span key={String(k)} style={{
              padding: '2px 6px', borderRadius: 4,
              background: v ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.04)',
              color: v ? '#86efac' : 'rgba(255,255,255,0.4)',
            }}>
              {k}: {String(v)}
            </span>
          ))}
        </div>
      </div>

      {result.Question && result.Question.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>问题</div>
          {result.Question.map((q, i) => (
            <div key={i} style={{ fontFamily: 'monospace', fontSize: 12, color: '#d4d4d8' }}>
              {q.name} · {getTypeName(q.type)}
            </div>
          ))}
        </div>
      )}

      {answers.length > 0 && (
        <div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>
            回答 ({answers.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {answers.map((a, i) => (
              <div key={i} style={{
                display: 'grid',
                gridTemplateColumns: '80px 1fr',
                gap: 8,
                padding: '8px 12px',
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 6,
                fontSize: 12,
              }}>
                <span style={{
                  color: '#a78bfa', fontFamily: 'monospace', fontWeight: 600,
                }}>
                  {getTypeName(a.type)}
                </span>
                <span style={{ fontFamily: 'monospace', color: '#e4e4e7', wordBreak: 'break-all' }}>
                  {a.data} <span style={{ color: 'rgba(255,255,255,0.4)' }}>· {a.TTL}s</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {result.Authority && result.Authority.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>
            授权 ({result.Authority.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {result.Authority.map((a, i) => (
              <div key={i} style={{
                padding: '6px 10px',
                background: 'rgba(0,0,0,0.15)',
                borderRadius: 6,
                fontFamily: 'monospace', fontSize: 12,
                color: '#a1a1aa',
              }}>
                {getTypeName(a.type)} {a.name} → {a.data}
              </div>
            ))}
          </div>
        </div>
      )}

      {answers.length === 0 && (!result.Authority || result.Authority.length === 0) && ok && (
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', padding: 16, textAlign: 'center' }}>
          未返回任何记录。可能该记录类型在该域名上未配置。
        </div>
      )}
    </div>
  )
}

function IpInfoView({ info }: { info: any }) {
  const fields: [string, any, string][] = [
    ['IP', info.ip, 'string'],
    ['版本', info.version, 'string'],
    ['城市', info.city, 'string'],
    ['地区/州', info.region, 'string'],
    ['国家', info.country_name, 'string'],
    ['国旗', info.country_code ? getFlagEmoji(info.country_code) : '', 'string'],
    ['大洲', info.continent_code, 'string'],
    ['邮编', info.postal, 'string'],
    ['纬度', info.latitude, 'number'],
    ['经度', info.longitude, 'number'],
    ['时区', info.timezone, 'string'],
    ['UTC 偏移', info.utc_offset, 'string'],
    ['ASN', info.asn, 'string'],
    ['ISP', info.org, 'string'],
    ['网络', info.network, 'string'],
  ].filter(([, v]) => v !== null && v !== undefined && v !== '' && v !== 'None') as [string, any, string][]

  const interestingFields = fields.filter(([k]) => !['纬度', '经度'].includes(k))
  const lat = info.latitude
  const lon = info.longitude

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 12,
      padding: 16,
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14,
        flexWrap: 'wrap', gap: 8,
      }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>
          {info.ip}
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
          {info.city ? info.city : ''}{info.region ? `, ${info.region}` : ''}{info.country_name ? `, ${info.country_name}` : ''}
        </div>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8,
        marginBottom: 14,
      }}>
        {interestingFields.map(([k, v]) => (
          <div key={k} style={{
            background: 'rgba(0,0,0,0.2)',
            border: '1px solid rgba(255,255,255,0.06)',
            padding: 10,
            borderRadius: 8,
          }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {k}
            </div>
            <div style={{ fontSize: 13, color: '#f4f4f5', fontFamily: 'monospace', wordBreak: 'break-word' }}>
              {String(v)}
            </div>
          </div>
        ))}
      </div>

      {typeof lat === 'number' && typeof lon === 'number' && (
        <div style={{
          background: 'rgba(0,0,0,0.2)',
          borderRadius: 10,
          padding: 14,
          textAlign: 'center',
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>
            🗺️ 位置坐标
          </div>
          <div style={{ fontSize: 13, fontFamily: 'monospace', color: '#e4e4e7', marginBottom: 8 }}>
            {lat.toFixed(4)}, {lon.toFixed(4)}
          </div>
          <a
            href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=10/${lat}/${lon}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 12, color: '#93c5fd', textDecoration: 'none',
            }}
          >
            在 OpenStreetMap 中查看 →
          </a>
        </div>
      )}
    </div>
  )
}

function getFlagEmoji(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
}

function QuickTools({ history }: { history: { q: string; type: number; ok: boolean; t: number }[] }) {
  const [uuidCount, setUuidCount] = useState(5)
  const uuids = useMemo(() => Array.from({ length: uuidCount }, () => crypto.randomUUID()), [uuidCount])

  const [pwLen, setPwLen] = useState(16)
  const [useUpper, setUseUpper] = useState(true)
  const [useNum, setUseNum] = useState(true)
  const [useSym, setUseSym] = useState(false)
  const password = useMemo(() => {
    let charset = 'abcdefghijklmnopqrstuvwxyz'
    if (useUpper) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    if (useNum) charset += '0123456789'
    if (useSym) charset += '!@#$%^&*()-_=+[]{};:,.?/~'
    const arr = new Uint32Array(pwLen)
    crypto.getRandomValues(arr)
    return Array.from(arr).map((n) => charset[n % charset.length]).join('')
  }, [pwLen, useUpper, useNum, useSym])

  const [base64Input, setBase64Input] = useState('Hello World')
  const base64Encoded = useMemo(() => {
    try { return btoa(unescape(encodeURIComponent(base64Input))) } catch { return '—' }
  }, [base64Input])
  const base64Decoded = useMemo(() => {
    try { return decodeURIComponent(escape(atob(base64Input))) } catch { return '（无法解码，请输入 Base64 文本）' }
  }, [base64Input])

  const [urlInput, setUrlInput] = useState('https://example.com/path?name=你好世界')
  const urlEncoded = useMemo(() => encodeURIComponent(urlInput), [urlInput])
  const urlDecoded = useMemo(() => {
    try { return decodeURIComponent(urlInput) } catch { return '—' }
  }, [urlInput])

  const [epochInput, setEpochInput] = useState<string>(String(Math.floor(Date.now() / 1000)))
  const epochTime = useMemo(() => {
    const n = parseInt(epochInput, 10)
    if (!isFinite(n)) return '—'
    return new Date(n * 1000).toLocaleString()
  }, [epochInput])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <ToolCard title="🆔 UUID 生成器">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <button
            onClick={() => setUuidCount(Math.max(1, uuidCount - 1))}
            style={miniBtn}
          >-</button>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>数量: {uuidCount}</span>
          <button onClick={() => setUuidCount(Math.min(50, uuidCount + 1))} style={miniBtn}>+</button>
          <button onClick={() => setUuidCount(5)} style={miniBtn}>重置</button>
        </div>
        {uuids.map((u, i) => (
          <div key={i} style={{
            background: 'rgba(0,0,0,0.25)',
            padding: '6px 10px',
            borderRadius: 6,
            fontFamily: 'monospace',
            fontSize: 12,
            color: '#e4e4e7',
            userSelect: 'all',
            marginBottom: 4,
          }}>
            {u}
          </div>
        ))}
      </ToolCard>

      <ToolCard title="🔑 密码生成器">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
          <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>长度: </label>
          <input
            type="number"
            value={pwLen}
            onChange={(e) => setPwLen(Math.max(1, Math.min(200, parseInt(e.target.value, 10) || 0)))}
            style={smallInput}
          />
          <Check label="大写" value={useUpper} onChange={setUseUpper} />
          <Check label="数字" value={useNum} onChange={setUseNum} />
          <Check label="符号" value={useSym} onChange={setUseSym} />
        </div>
        <div style={{
          background: 'rgba(0,0,0,0.25)',
          padding: 14,
          borderRadius: 6,
          fontFamily: 'monospace',
          fontSize: 14,
          color: '#fbbf24',
          userSelect: 'all',
          wordBreak: 'break-all',
        }}>{password}</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>
          强度：{Math.floor(Math.log2(Math.pow((useUpper?26:0)+26+(useNum?10:0)+(useSym?32:0), pwLen)))} bits
        </div>
      </ToolCard>

      <ToolCard title="🔤 Base64 编解码">
        <textarea
          value={base64Input}
          onChange={(e) => setBase64Input(e.target.value)}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            minHeight: 60,
            padding: 10,
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 6,
            color: '#fff',
            fontFamily: 'monospace',
            fontSize: 12,
            outline: 'none',
            resize: 'vertical',
          }}
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
          <div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', marginBottom: 4 }}>Encoded</div>
            <div style={{ background: 'rgba(0,0,0,0.25)', padding: 10, borderRadius: 6, fontFamily: 'monospace', fontSize: 11, color: '#86efac', wordBreak: 'break-all' }}>
              {base64Encoded}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', marginBottom: 4 }}>Decoded（将输入视为 base64）</div>
            <div style={{ background: 'rgba(0,0,0,0.25)', padding: 10, borderRadius: 6, fontFamily: 'monospace', fontSize: 11, color: '#93c5fd', wordBreak: 'break-all' }}>
              {base64Decoded}
            </div>
          </div>
        </div>
      </ToolCard>

      <ToolCard title="🔗 URL 编解码">
        <textarea
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          style={{
            width: '100%', boxSizing: 'border-box',
            minHeight: 50, padding: 10,
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 6, color: '#fff',
            fontFamily: 'monospace', fontSize: 12,
            outline: 'none', resize: 'vertical',
          }}
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
          <div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', marginBottom: 4 }}>编码</div>
            <div style={{ background: 'rgba(0,0,0,0.25)', padding: 10, borderRadius: 6, fontFamily: 'monospace', fontSize: 11, color: '#86efac', wordBreak: 'break-all' }}>
              {urlEncoded}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', marginBottom: 4 }}>解码</div>
            <div style={{ background: 'rgba(0,0,0,0.25)', padding: 10, borderRadius: 6, fontFamily: 'monospace', fontSize: 11, color: '#93c5fd', wordBreak: 'break-all' }}>
              {urlDecoded}
            </div>
          </div>
        </div>
      </ToolCard>

      <ToolCard title="🕐 Unix 时间戳转换">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <input
            value={epochInput}
            onChange={(e) => setEpochInput(e.target.value)}
            style={{ ...smallInput, width: 180 }}
          />
          <button onClick={() => setEpochInput(String(Math.floor(Date.now() / 1000)))} style={miniBtn}>
            现在
          </button>
        </div>
        <div style={{ background: 'rgba(0,0,0,0.25)', padding: 14, borderRadius: 6, fontSize: 13, color: '#fca5a5' }}>
          {epochTime}
        </div>
      </ToolCard>

      {history.length > 0 && (
        <ToolCard title="📜 查询历史（最近）">
          {history.slice(0, 6).map((h, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '6px 10px',
              background: 'rgba(0,0,0,0.2)',
              borderRadius: 6,
              fontSize: 12,
              marginBottom: 4,
              fontFamily: 'monospace',
            }}>
              <span style={{ color: h.ok ? '#86efac' : '#fca5a5' }}>
                {h.ok ? '✓' : '✗'} {h.q} [{getTypeName(h.type)}]
              </span>
              <span style={{ color: 'rgba(255,255,255,0.4)' }}>
                {new Date(h.t).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </ToolCard>
      )}
    </div>
  )
}

function ToolCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 12,
      padding: 16,
    }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: '#e4e4e7' }}>{title}</div>
      {children}
    </div>
  )
}

function Check({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'rgba(255,255,255,0.75)', cursor: 'pointer' }}>
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  )
}

const miniBtn: React.CSSProperties = {
  padding: '4px 10px',
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.12)',
  color: '#e4e4e7',
  borderRadius: 6,
  fontSize: 12,
  cursor: 'pointer',
}

const smallInput: React.CSSProperties = {
  padding: '6px 10px',
  background: 'rgba(0,0,0,0.3)',
  color: '#fff',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 6,
  fontSize: 12,
  fontFamily: 'monospace',
  outline: 'none',
}

export default DnsLookup
