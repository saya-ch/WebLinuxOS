import { useState, useEffect } from 'react'

interface IPInfo {
  ip: string
  city: string
  region: string
  country: string
  loc: string
  org: string
  timezone: string
}

interface DNSInfo {
  domain: string
  records: string[]
  type: string
}

export default function IPLookup() {
  const [ipInput, setIpInput] = useState('')
  const [ipInfo, setIpInfo] = useState<IPInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'ip' | 'dns'>('ip')
  const [dnsDomain, setDnsDomain] = useState('')
  const [dnsInfo, setDnsInfo] = useState<DNSInfo | null>(null)
  const [dnsLoading, setDnsLoading] = useState(false)
  const [myIP, setMyIP] = useState<string>('')

  // 获取用户自己的IP
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

  const lookupIP = async (ip: string) => {
    if (!ip.trim()) return
    
    setLoading(true)
    setError(null)
    
    try {
      // 使用 ipapi.co 免费API
      const response = await fetch(`https://ipapi.co/${ip}/json/`)
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.reason || '查询失败')
      }
      
      setIpInfo({
        ip: data.ip,
        city: data.city,
        region: data.region,
        country: data.country_name,
        loc: `${data.latitude}, ${data.longitude}`,
        org: data.org,
        timezone: data.timezone,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : '查询失败')
      setIpInfo(null)
    } finally {
      setLoading(false)
    }
  }

  const lookupDNS = async (domain: string) => {
    if (!domain.trim()) return
    
    setDnsLoading(true)
    setDnsInfo(null)
    
    try {
      // 使用 Cloudflare DNS over HTTPS API
      const response = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=A`, {
        headers: {
          'Accept': 'application/dns-json'
        }
      })
      const data = await response.json()
      
      if (data.Answer) {
        setDnsInfo({
          domain: domain,
          type: 'A',
          records: data.Answer.map((r: any) => r.data)
        })
      } else {
        setDnsInfo({
          domain: domain,
          type: 'A',
          records: []
        })
      }
    } catch (err) {
      setDnsInfo({
        domain: domain,
        type: 'A',
        records: ['查询失败，请检查域名格式']
      })
    } finally {
      setDnsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (activeTab === 'ip') {
      lookupIP(ipInput)
    } else {
      lookupDNS(dnsDomain)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('已复制到剪贴板')
    })
  }

  return (
    <div className="app-container" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      color: '#fff',
      overflow: 'auto'
    }}>
      {/* 头部 */}
      <div style={{ 
        padding: '24px', 
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(0,0,0,0.2)'
      }}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: '24px' }}>🌐 IP & DNS 查询工具</h1>
        <p style={{ margin: 0, color: '#888', fontSize: '14px' }}>
          查询IP地址信息、地理位置和DNS记录
        </p>
        {myIP && (
          <div style={{ 
            marginTop: '12px', 
            padding: '8px 16px', 
            background: 'rgba(102, 126, 234, 0.2)', 
            borderRadius: '8px',
            display: 'inline-block'
          }}>
            <span style={{ color: '#a5b4fc', fontSize: '13px' }}>你的IP: </span>
            <span style={{ color: '#fff', fontWeight: 600 }}>{myIP}</span>
            <button
              onClick={() => copyToClipboard(myIP)}
              style={{
                marginLeft: '12px',
                padding: '4px 12px',
                border: 'none',
                borderRadius: '4px',
                background: '#667eea',
                color: '#fff',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              复制
            </button>
          </div>
        )}
      </div>

      {/* 标签页切换 */}
      <div style={{ 
        display: 'flex', 
        gap: '2px',
        padding: '0 24px',
        background: 'rgba(0,0,0,0.1)'
      }}>
        <button
          onClick={() => setActiveTab('ip')}
          style={{
            padding: '16px 24px',
            border: 'none',
            background: activeTab === 'ip' ? 'rgba(102, 126, 234, 0.3)' : 'transparent',
            color: activeTab === 'ip' ? '#fff' : '#888',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: activeTab === 'ip' ? 600 : 400,
            borderBottom: activeTab === 'ip' ? '2px solid #667eea' : '2px solid transparent'
          }}
        >
          📍 IP 查询
        </button>
        <button
          onClick={() => setActiveTab('dns')}
          style={{
            padding: '16px 24px',
            border: 'none',
            background: activeTab === 'dns' ? 'rgba(102, 126, 234, 0.3)' : 'transparent',
            color: activeTab === 'dns' ? '#fff' : '#888',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: activeTab === 'dns' ? 600 : 400,
            borderBottom: activeTab === 'dns' ? '2px solid #667eea' : '2px solid transparent'
          }}
        >
          🔍 DNS 查询
        </button>
      </div>

      {/* 搜索区域 */}
      <div style={{ padding: '24px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '12px' }}>
          <input
            type="text"
            value={activeTab === 'ip' ? ipInput : dnsDomain}
            onChange={(e) => activeTab === 'ip' ? setIpInput(e.target.value) : setDnsDomain(e.target.value)}
            placeholder={activeTab === 'ip' ? '输入IP地址 (例如: 8.8.8.8)' : '输入域名 (例如: google.com)'}
            style={{
              flex: 1,
              padding: '14px 18px',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.05)',
              color: '#fff',
              fontSize: '15px',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={activeTab === 'ip' ? loading : dnsLoading}
            style={{
              padding: '14px 32px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              fontSize: '15px',
              fontWeight: 600,
              cursor: (activeTab === 'ip' ? loading : dnsLoading) ? 'not-allowed' : 'pointer',
              opacity: (activeTab === 'ip' ? loading : dnsLoading) ? 0.7 : 1,
            }}
          >
            {(activeTab === 'ip' ? loading : dnsLoading) ? '查询中...' : '查询'}
          </button>
        </form>
      </div>

      {/* 结果区域 */}
      <div style={{ flex: 1, padding: '0 24px 24px', overflow: 'auto' }}>
        {activeTab === 'ip' ? (
          <>
            {error && (
              <div style={{ 
                padding: '16px', 
                background: 'rgba(239, 68, 68, 0.2)', 
                borderRadius: '12px',
                color: '#fca5a5',
                marginBottom: '16px'
              }}>
                ⚠️ {error}
              </div>
            )}
            
            {ipInfo && (
              <div style={{ 
                background: 'rgba(255,255,255,0.03)', 
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.1)',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  padding: '20px', 
                  background: 'rgba(102, 126, 234, 0.2)',
                  borderBottom: '1px solid rgba(255,255,255,0.1)'
                }}>
                  <div style={{ fontSize: '14px', color: '#a5b4fc', marginBottom: '4px' }}>IP 地址</div>
                  <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'monospace' }}>
                    {ipInfo.ip}
                  </div>
                </div>
                
                <div style={{ padding: '20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                    <InfoCard 
                      label="国家/地区" 
                      value={`${ipInfo.country} (${ipInfo.region})`} 
                      icon="🌍"
                    />
                    <InfoCard 
                      label="城市" 
                      value={ipInfo.city} 
                      icon="🏙️"
                    />
                    <InfoCard 
                      label="坐标" 
                      value={ipInfo.loc} 
                      icon="📍"
                    />
                    <InfoCard 
                      label="时区" 
                      value={ipInfo.timezone} 
                      icon="🕐"
                    />
                    <InfoCard 
                      label="运营商" 
                      value={ipInfo.org || '未知'} 
                      icon="🏢"
                    />
                  </div>
                </div>
              </div>
            )}
            
            {!ipInfo && !error && !loading && (
              <div style={{ 
                textAlign: 'center', 
                padding: '60px 20px',
                color: '#666'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
                <div style={{ fontSize: '16px' }}>输入IP地址开始查询</div>
                <div style={{ fontSize: '13px', marginTop: '8px', color: '#555' }}>
                  支持 IPv4 和 IPv6 地址
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {dnsInfo && (
              <div style={{ 
                background: 'rgba(255,255,255,0.03)', 
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.1)',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  padding: '20px', 
                  background: 'rgba(102, 126, 234, 0.2)',
                  borderBottom: '1px solid rgba(255,255,255,0.1)'
                }}>
                  <div style={{ fontSize: '14px', color: '#a5b4fc', marginBottom: '4px' }}>域名</div>
                  <div style={{ fontSize: '24px', fontWeight: 700 }}>
                    {dnsInfo.domain}
                  </div>
                </div>
                
                <div style={{ padding: '20px' }}>
                  <div style={{ fontSize: '14px', color: '#888', marginBottom: '12px' }}>
                    DNS 记录 (Type: {dnsInfo.type})
                  </div>
                  {dnsInfo.records.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {dnsInfo.records.map((record, index) => (
                        <div 
                          key={index}
                          style={{ 
                            padding: '12px 16px', 
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '8px',
                            fontFamily: 'monospace',
                            fontSize: '14px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <span>{record}</span>
                          <button
                            onClick={() => copyToClipboard(record)}
                            style={{
                              padding: '4px 12px',
                              border: 'none',
                              borderRadius: '4px',
                              background: '#667eea',
                              color: '#fff',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                          >
                            复制
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: '#888', textAlign: 'center', padding: '20px' }}>
                      未找到 DNS 记录
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {!dnsInfo && !dnsLoading && (
              <div style={{ 
                textAlign: 'center', 
                padding: '60px 20px',
                color: '#666'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌐</div>
                <div style={{ fontSize: '16px' }}>输入域名查询DNS记录</div>
                <div style={{ fontSize: '13px', marginTop: '8px', color: '#555' }}>
                  支持 A, AAAA, CNAME 等记录类型
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function InfoCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div style={{ 
      padding: '16px', 
      background: 'rgba(255,255,255,0.03)',
      borderRadius: '12px',
      border: '1px solid rgba(255,255,255,0.05)'
    }}>
      <div style={{ fontSize: '13px', color: '#888', marginBottom: '4px' }}>
        {icon} {label}
      </div>
      <div style={{ fontSize: '16px', fontWeight: 500, color: '#fff' }}>
        {value || '未知'}
      </div>
    </div>
  )
}
