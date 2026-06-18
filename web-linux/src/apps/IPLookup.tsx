import { useState, useEffect } from 'react'

interface IPInfo {
  ip: string
  city: string
  region: string
  country: string
  country_code: string
  postal: string
  currency: string
  loc: string
  org: string
  timezone: string
}

interface DNSRecord {
  type: string
  data: string
  TTL: number
}

interface DNSInfo {
  domain: string
  records: DNSRecord[]
}

interface WHOISInfo {
  domain: string
  registrar: string
  creationDate: string
  expirationDate: string
  updatedDate: string
  nameservers: string[]
  raw: string
}

interface PingResult {
  target: string
  min: number
  max: number
  avg: number
  times: number[]
  successful: number
  total: number
}

type TabKey = 'ip' | 'dns' | 'whois' | 'ping'

const DnsRecordType = ['A', 'AAAA', 'MX', 'TXT', 'NS'] as const
type DnsRecordTypeValue = typeof DnsRecordType[number]

export default function IPLookup() {
  const [ipInput, setIpInput] = useState('')
  const [ipInfo, setIpInfo] = useState<IPInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>('ip')
  const [dnsDomain, setDnsDomain] = useState('')
  const [dnsInfo, setDnsInfo] = useState<DNSInfo | null>(null)
  const [dnsType, setDnsType] = useState<DnsRecordTypeValue>('A')
  const [dnsLoading, setDnsLoading] = useState(false)
  const [dnsError, setDnsError] = useState<string | null>(null)
  const [whoisDomain, setWhoisDomain] = useState('')
  const [whoisInfo, setWhoisInfo] = useState<WHOISInfo | null>(null)
  const [whoisLoading, setWhoisLoading] = useState(false)
  const [whoisError, setWhoisError] = useState<string | null>(null)
  const [pingTarget, setPingTarget] = useState('')
  const [pingResult, setPingResult] = useState<PingResult | null>(null)
  const [pingLoading, setPingLoading] = useState(false)
  const [pingError, setPingError] = useState<string | null>(null)
  const [myIP, setMyIP] = useState<string>('')
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null)

  useEffect(() => {
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => {
        setMyIP(data.ip)
        setIpInput(data.ip)
      })
      .catch(() => {
        setMyIP('获取失败')
      })
  }, [])

  const showCopyFeedback = (msg: string) => {
    setCopyFeedback(msg)
    setTimeout(() => setCopyFeedback(null), 1500)
  }

  const copyToClipboard = async (text: string, label = '已复制到剪贴板') => {
    try {
      await navigator.clipboard.writeText(text)
      showCopyFeedback(label)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      try {
        document.execCommand('copy')
        showCopyFeedback(label)
      } catch {
        showCopyFeedback('复制失败')
      }
      document.body.removeChild(ta)
    }
  }

  const lookupIP = async (ip: string) => {
    if (!ip.trim()) return
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`https://ipapi.co/${encodeURIComponent(ip.trim())}/json/`)
      if (!response.ok) {
        throw new Error(`查询失败 (HTTP ${response.status})`)
      }
      const data = await response.json()
      if (data.error) {
        throw new Error(data.reason || '查询失败')
      }
      setIpInfo({
        ip: data.ip,
        city: data.city,
        region: data.region,
        country: data.country_name,
        country_code: data.country_code || '',
        postal: data.postal || '',
        currency: data.currency || '',
        loc: `${data.latitude}, ${data.longitude}`,
        org: data.org,
        timezone: data.timezone,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : '查询失败，请稍后重试')
      setIpInfo(null)
    } finally {
      setLoading(false)
    }
  }

  const lookupDNS = async (domain: string, type: DnsRecordTypeValue) => {
    if (!domain.trim()) return
    setDnsLoading(true)
    setDnsError(null)
    setDnsInfo(null)
    try {
      const response = await fetch(
        `https://dns.google/resolve?name=${encodeURIComponent(domain.trim())}&type=${type}`
      )
      if (!response.ok) {
        throw new Error(`查询失败 (HTTP ${response.status})`)
      }
      const data = await response.json()
      if (data.Answer && Array.isArray(data.Answer) && data.Answer.length > 0) {
        const records: DNSRecord[] = data.Answer.map((r: { data: string; type: number; TTL: number }) => ({
          type: String(r.type),
          data: r.data,
          TTL: r.TTL,
        }))
        setDnsInfo({ domain, records })
      } else if (data.Status === 3) {
        setDnsError('未找到 DNS 记录 (NXDOMAIN)')
      } else if (data.Status && data.Status !== 0) {
        setDnsError(`DNS 查询返回状态码: ${data.Status}`)
      } else {
        setDnsInfo({ domain, records: [] })
      }
    } catch {
      setDnsError('查询失败，请检查域名格式或网络连接')
    } finally {
      setDnsLoading(false)
    }
  }

  const parseWHOIS = (raw: string): Partial<WHOISInfo> => {
    const result: Partial<WHOISInfo> = {}
    const lines = raw.split(/\r?\n/)
    const map: Record<string, string> = {}
    for (const line of lines) {
      const m = /^\s*([A-Za-z0-9][A-Za-z0-9 ]+?):\s*(.+)$/.exec(line)
      if (m) {
        const key = m[1].trim().toLowerCase()
        const value = m[2].trim()
        if (!map[key]) map[key] = value
      }
    }
    result.registrar = map['registrar'] || map['registrar whois server'] || map['registry domain id'] ? map['registrar'] : ''
    result.creationDate = map['creation date'] || map['created'] || map['registration time'] || ''
    result.expirationDate = map['registrar registration expiration date'] || map['expiration date'] || map['expiry date'] || ''
    result.updatedDate = map['updated date'] || map['last updated'] || map['last-updated'] || ''
    const nameservers: string[] = []
    for (const k of Object.keys(map)) {
      if (k.startsWith('name server')) nameservers.push(map[k])
    }
    const ns2 = nameservers.filter((v, i, a) => a.indexOf(v) === i).slice(0, 10)
    result.nameservers = ns2.length > 0 ? ns2 : []
    return result
  }

  const lookupWHOIS = async (domain: string) => {
    if (!domain.trim()) return
    setWhoisLoading(true)
    setWhoisError(null)
    setWhoisInfo(null)
    try {
      const cleanDomain = domain.trim().replace(/^https?:\/\//, '').split('/')[0]
      const url = `https://whois.arin.net/rest/domain/${encodeURIComponent(cleanDomain)}`
      let raw = ''
      try {
        const response = await fetch(url, {
          headers: { Accept: 'text/plain' }
        })
        if (response.ok) {
          raw = await response.text()
        }
      } catch {
        raw = ''
      }

      if (!raw || raw.length < 20) {
        throw new Error('WHOIS 查询失败，使用在线服务暂不可用，请稍后重试')
      }

      const parsed = parseWHOIS(raw)
      const registrar = parsed.registrar || '未找到'
      setWhoisInfo({
        domain: cleanDomain,
        registrar: registrar || '未找到',
        creationDate: parsed.creationDate || '未找到',
        expirationDate: parsed.expirationDate || '未找到',
        updatedDate: parsed.updatedDate || '未找到',
        nameservers: parsed.nameservers && parsed.nameservers.length > 0 ? parsed.nameservers : ['未找到'],
        raw,
      })
    } catch (err) {
      setWhoisError(err instanceof Error ? err.message : '查询失败，请稍后重试')
    } finally {
      setWhoisLoading(false)
    }
  }

  const doPing = async (target: string) => {
    if (!target.trim()) return
    setPingLoading(true)
    setPingError(null)
    setPingResult(null)
    const cleanTarget = target.trim().replace(/^https?:\/\//, '').split('/')[0]
    const urls = [
      `https://dns.google/resolve?name=${encodeURIComponent(cleanTarget)}&type=A`,
      `https://ipapi.co/${encodeURIComponent(cleanTarget)}/json/`,
    ]
    const pingUrl = urls[0]
    const times: number[] = []
    const total = 4
    let successful = 0
    for (let i = 0; i < total; i++) {
      const start = performance.now()
      try {
        const res = await fetch(pingUrl, { method: 'GET', cache: 'no-store' })
        const elapsed = performance.now() - start
        if (res.ok) {
          times.push(elapsed)
          successful++
        } else {
          times.push(elapsed)
        }
      } catch {
        times.push(0)
      }
      await new Promise(r => setTimeout(r, 150))
    }

    const valid = times.filter(t => t > 0)
    if (valid.length === 0) {
      setPingError('无法连接到目标主机')
      setPingLoading(false)
      return
    }
    const min = Math.min(...valid)
    const max = Math.max(...valid)
    const avg = valid.reduce((a, b) => a + b, 0) / valid.length
    setPingResult({
      target: cleanTarget,
      min,
      max,
      avg,
      times,
      successful,
      total,
    })
    setPingLoading(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (activeTab === 'ip') lookupIP(ipInput)
    else if (activeTab === 'dns') lookupDNS(dnsDomain, dnsType)
    else if (activeTab === 'whois') lookupWHOIS(whoisDomain)
    else if (activeTab === 'ping') doPing(pingTarget)
  }

  const getTabPlaceholder = () => {
    switch (activeTab) {
      case 'ip': return '输入IP地址 (例如: 8.8.8.8)'
      case 'dns': return '输入域名 (例如: google.com)'
      case 'whois': return '输入域名 (例如: example.com)'
      case 'ping': return '输入域名或IP (例如: google.com)'
    }
  }

  const getTabInputValue = () => {
    switch (activeTab) {
      case 'ip': return ipInput
      case 'dns': return dnsDomain
      case 'whois': return whoisDomain
      case 'ping': return pingTarget
    }
  }

  const setTabInput = (v: string) => {
    switch (activeTab) {
      case 'ip': setIpInput(v); break
      case 'dns': setDnsDomain(v); break
      case 'whois': setWhoisDomain(v); break
      case 'ping': setPingTarget(v); break
    }
  }

  const isTabLoading = () => {
    switch (activeTab) {
      case 'ip': return loading
      case 'dns': return dnsLoading
      case 'whois': return whoisLoading
      case 'ping': return pingLoading
    }
  }

  const renderTabContent = () => {
    if (activeTab === 'ip') {
      return (
        <>
          {error && (
            <div style={{
              padding: '16px', background: 'rgba(239, 68, 68, 0.2)', borderRadius: '12px',
              color: '#fca5a5', marginBottom: '16px',
            }}>
              ⚠️ {error}
            </div>
          )}
          {ipInfo && (
            <div style={{
              background: '#2a2a3e', borderRadius: '16px',
              border: '1px solid var(--window-border)', overflow: 'hidden',
            }}>
              <div style={{
              padding: '20px', background: 'var(--accent-bg)', borderBottom: '1px solid var(--window-border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
                <div>
                  <div style={{ fontSize: '14px', color: 'var(--accent)', marginBottom: '4px' }}>IP 地址</div>
                  <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'monospace' }}>{ipInfo.ip}</div>
                </div>
                <button
                  onClick={() => copyToClipboard(ipInfo.ip)}
                  style={{
                    padding: '6px 14px', border: 'none', borderRadius: '6px',
                    background: 'var(--accent)', color: '#fff', fontSize: '12px', cursor: 'pointer',
                  }}
                >
                  📋 复制
                </button>
              </div>
              <div style={{ padding: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                  <InfoCard label="国家/地区" value={`${ipInfo.country} (${ipInfo.region})`} icon="🌍" />
                  <InfoCard label="国家代码" value={ipInfo.country_code || '未知'} icon="🏳️" />
                  <InfoCard label="城市" value={ipInfo.city} icon="🏙️" />
                  <InfoCard label="邮编" value={ipInfo.postal || '未知'} icon="📮" />
                  <InfoCard label="坐标" value={ipInfo.loc} icon="📍" />
                  <InfoCard label="时区" value={ipInfo.timezone} icon="🕐" />
                  <InfoCard label="运营商" value={ipInfo.org || '未知'} icon="🏢" />
                  <InfoCard label="货币" value={ipInfo.currency || '未知'} icon="💰" />
                </div>
              </div>
            </div>
          )}
          {!ipInfo && !error && !loading && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
              <div style={{ fontSize: '16px' }}>输入IP地址开始查询</div>
              <div style={{ fontSize: '13px', marginTop: '8px' }}>支持 IPv4 和 IPv6 地址</div>
            </div>
          )}
        </>
      )
    }
    if (activeTab === 'dns') {
      return (
        <>
          {dnsError && (
            <div style={{
              padding: '16px', background: 'rgba(239, 68, 68, 0.2)', borderRadius: '12px',
              color: '#fca5a5', marginBottom: '16px',
            }}>
              ⚠️ {dnsError}
            </div>
          )}
          {dnsInfo && (
            <div style={{
              background: '#2a2a3e', borderRadius: '16px',
              border: '1px solid var(--window-border)', overflow: 'hidden',
            }}>
              <div style={{
              padding: '20px', background: 'var(--accent-bg)', borderBottom: '1px solid var(--window-border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
                <div>
                  <div style={{ fontSize: '14px', color: 'var(--accent)', marginBottom: '4px' }}>域名</div>
                  <div style={{ fontSize: '24px', fontWeight: 700 }}>{dnsInfo.domain}</div>
                </div>
                <button
                  onClick={() => copyToClipboard(dnsInfo.records.map(r => r.data).join('\n'))}
                  style={{
                    padding: '6px 14px', border: 'none', borderRadius: '6px',
                    background: 'var(--accent)', color: '#fff', fontSize: '12px', cursor: 'pointer',
                  }}
                >
                  📋 复制全部
                </button>
              </div>
              <div style={{ padding: '20px' }}>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  DNS 记录 (Type: {dnsType})
                </div>
                {dnsInfo.records.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {dnsInfo.records.map((record, index) => (
                      <div key={index} style={{
                        padding: '12px 16px', background: '#3a3a4e', borderRadius: '8px',
                        fontFamily: 'monospace', fontSize: '14px',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px',
                      }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {record.data}
                        </span>
                        <div style={{ display: 'flex', gap: '8px', flexShrink: 0, alignItems: 'center' }}>
                          {record.TTL != null && (
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>TTL: {record.TTL}s</span>
                          )}
                          <button
                            onClick={() => copyToClipboard(record.data)}
                            style={{
                              padding: '4px 12px', border: 'none', borderRadius: '4px',
                              background: 'var(--accent)', color: '#fff', fontSize: '12px', cursor: 'pointer',
                            }}
                          >
                            复制
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>
                    未找到 DNS 记录
                  </div>
                )}
              </div>
            </div>
          )}
          {!dnsInfo && !dnsError && !dnsLoading && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌐</div>
              <div style={{ fontSize: '16px' }}>输入域名查询 DNS 记录</div>
              <div style={{ fontSize: '13px', marginTop: '8px' }}>支持 A, AAAA, MX, TXT, NS 记录</div>
            </div>
          )}
        </>
      )
    }
    if (activeTab === 'whois') {
      return (
        <>
          {whoisError && (
            <div style={{
              padding: '16px', background: 'rgba(239, 68, 68, 0.2)', borderRadius: '12px',
              color: '#fca5a5', marginBottom: '16px',
            }}>
              ⚠️ {whoisError}
            </div>
          )}
          {whoisInfo && (
            <div style={{
              background: '#2a2a3e', borderRadius: '16px',
              border: '1px solid var(--window-border)', overflow: 'hidden',
            }}>
              <div style={{
              padding: '20px', background: 'var(--accent-bg)', borderBottom: '1px solid var(--window-border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
                <div>
                  <div style={{ fontSize: '14px', color: 'var(--accent)', marginBottom: '4px' }}>域名</div>
                  <div style={{ fontSize: '24px', fontWeight: 700 }}>{whoisInfo.domain}</div>
                </div>
                <button
                  onClick={() => copyToClipboard(whoisInfo.raw)}
                  style={{
                    padding: '6px 14px', border: 'none', borderRadius: '6px',
                    background: 'var(--accent)', color: '#fff', fontSize: '12px', cursor: 'pointer',
                  }}
                >
                  📋 复制 WHOIS
                </button>
              </div>
              <div style={{ padding: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                  <InfoCard label="注册商" value={whoisInfo.registrar} icon="🏢" />
                  <InfoCard label="创建日期" value={whoisInfo.creationDate} icon="📅" />
                  <InfoCard label="过期日期" value={whoisInfo.expirationDate} icon="⏰" />
                  <InfoCard label="更新日期" value={whoisInfo.updatedDate} icon="🔄" />
                </div>
                <div style={{ marginTop: '20px' }}>
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                    📡 名称服务器
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {whoisInfo.nameservers.map((ns, i) => (
                      <div key={i} style={{
                        padding: '10px 14px', background: '#3a3a4e', borderRadius: '8px',
                        fontFamily: 'monospace', fontSize: '13px',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      }}>
                        <span>{ns}</span>
                        <button onClick={() => copyToClipboard(ns)} style={{
                          padding: '4px 10px', border: 'none', borderRadius: '4px',
                          background: 'var(--accent)', color: '#fff', fontSize: '11px', cursor: 'pointer',
                        }}>
                          复制
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          {!whoisInfo && !whoisError && !whoisLoading && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
              <div style={{ fontSize: '16px' }}>输入域名查询 WHOIS 信息</div>
              <div style={{ fontSize: '13px', marginTop: '8px' }}>查看注册商、创建日期、名称服务器等信息</div>
            </div>
          )}
        </>
      )
    }
    if (activeTab === 'ping') {
      return (
        <>
          {pingError && (
            <div style={{
              padding: '16px', background: 'rgba(239, 68, 68, 0.2)', borderRadius: '12px',
              color: '#fca5a5', marginBottom: '16px',
            }}>
              ⚠️ {pingError}
            </div>
          )}
          {pingResult && (
            <div style={{
              background: '#2a2a3e', borderRadius: '16px',
              border: '1px solid var(--window-border)', overflow: 'hidden',
            }}>
              <div style={{
              padding: '20px', background: 'var(--accent-bg)', borderBottom: '1px solid var(--window-border)',
            }}>
                <div style={{ fontSize: '14px', color: 'var(--accent)', marginBottom: '4px' }}>目标主机</div>
                <div style={{ fontSize: '24px', fontWeight: 700 }}>{pingResult.target}</div>
              </div>
              <div style={{ padding: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                  <InfoCard label="最小延迟" value={`${pingResult.min.toFixed(1)} ms`} icon="⚡" />
                  <InfoCard label="最大延迟" value={`${pingResult.max.toFixed(1)} ms`} icon="🐢" />
                  <InfoCard label="平均延迟" value={`${pingResult.avg.toFixed(1)} ms`} icon="📊" />
                  <InfoCard label="成功率" value={`${pingResult.successful}/${pingResult.total}`} icon="✅" />
                </div>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  每次请求延迟
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {pingResult.times.map((t, i) => (
                    <div key={i} style={{
                      padding: '10px 14px', background: '#3a3a4e', borderRadius: '8px',
                      fontFamily: 'monospace', fontSize: '13px',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                      <span>请求 #{i + 1}</span>
                      <span style={{ color: t > 0 ? 'var(--text-primary)' : '#fca5a5' }}>
                        {t > 0 ? `${t.toFixed(1)} ms` : '失败'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {!pingResult && !pingError && !pingLoading && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📶</div>
              <div style={{ fontSize: '16px' }}>输入目标主机测试网络延迟</div>
              <div style={{ fontSize: '13px', marginTop: '8px' }}>通过多次 DNS 查询估算往返延迟</div>
            </div>
          )}
        </>
      )
    }
    return null
  }

  return (
    <div className="app-container" style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: 'var(--window-bg)', color: 'var(--text-primary)', overflow: 'auto',
    }}>
      <div style={{
        padding: '24px', borderBottom: '1px solid var(--window-border)',
        background: 'var(--titlebar-bg)',
      }}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: '24px' }}>🌐 IP & DNS 查询工具</h1>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
          查询IP地址信息、地理位置、DNS记录和域名注册信息
        </p>
        {myIP && (
          <div style={{
            marginTop: '12px', padding: '8px 16px', background: 'var(--accent-bg)',
            borderRadius: '8px', display: 'inline-block',
          }}>
            <span style={{ color: 'var(--accent)', fontSize: '13px' }}>你的IP: </span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{myIP}</span>
            <button
              onClick={() => copyToClipboard(myIP)}
              style={{
                marginLeft: '12px', padding: '4px 12px', border: 'none', borderRadius: '4px',
                background: 'var(--accent)', color: '#fff', fontSize: '12px', cursor: 'pointer',
              }}
            >
              复制
            </button>
          </div>
        )}
      </div>

      <div style={{
        display: 'flex', gap: '2px', padding: '0 24px', background: '#2a2a3e', flexWrap: 'wrap',
      }}>
        {([
          { key: 'ip' as const, label: '📍 IP 查询' },
          { key: 'dns' as const, label: '🔍 DNS 查询' },
          { key: 'whois' as const, label: '📋 WHOIS' },
          { key: 'ping' as const, label: '📶 Ping 测试' },
        ]).map(t => (
          <button
            key={t.key}
            onClick={() => { setActiveTab(t.key) }}
            style={{
              padding: '16px 24px', border: 'none',
              background: activeTab === t.key ? 'var(--accent-bg)' : 'transparent',
              color: activeTab === t.key ? 'var(--text-primary)' : 'var(--text-secondary)',
              cursor: 'pointer', fontSize: '14px',
              fontWeight: activeTab === t.key ? 600 : 400,
              borderBottom: activeTab === t.key ? '2px solid var(--accent)' : '2px solid transparent',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '24px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={getTabInputValue()}
            onChange={(e) => setTabInput(e.target.value)}
            placeholder={getTabPlaceholder()}
            style={{
              flex: 1, minWidth: '200px', padding: '14px 18px', borderRadius: '12px',
              border: '1px solid var(--window-border)',
              background: '#2a2a3e', color: 'var(--text-primary)', fontSize: '15px', outline: 'none',
            }}
          />
          {activeTab === 'dns' && (
            <select
              value={dnsType}
              onChange={(e) => setDnsType(e.target.value as DnsRecordTypeValue)}
              style={{
                padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--window-border)',
                background: '#2a2a3e', color: 'var(--text-primary)', fontSize: '14px', cursor: 'pointer', outline: 'none',
              }}
            >
              {DnsRecordType.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          )}
          <button
            type="submit"
            disabled={isTabLoading()}
            style={{
              padding: '14px 32px', borderRadius: '12px', border: 'none',
              background: 'var(--accent)', color: '#fff', fontSize: '15px', fontWeight: 600,
              cursor: isTabLoading() ? 'not-allowed' : 'pointer',
              opacity: isTabLoading() ? 0.7 : 1,
            }}
          >
            {isTabLoading() ? '查询中...' : '查询'}
          </button>
        </form>
        {copyFeedback && (
          <div style={{
            marginTop: '12px', padding: '8px 16px', background: 'rgba(34, 197, 94, 0.2)',
            borderRadius: '8px', color: '#86efac', fontSize: '13px', display: 'inline-block',
          }}>
            ✓ {copyFeedback}
          </div>
        )}
      </div>

      <div style={{ flex: 1, padding: '0 24px 24px', overflow: 'auto' }}>
        {renderTabContent()}
      </div>
    </div>
  )
}

function InfoCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div style={{
      padding: '16px', background: '#3a3a4e', borderRadius: '12px',
      border: '1px solid var(--window-border)',
    }}>
      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
        {icon} {label}
      </div>
      <div style={{ fontSize: '16px', fontWeight: 500, wordBreak: 'break-word' }}>
        {value || '未知'}
      </div>
    </div>
  )
}
