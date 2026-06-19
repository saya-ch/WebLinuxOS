import { useState, useEffect, useCallback, memo } from 'react'

interface IPLocation {
  ip: string
  country: string
  countryCode: string
  region: string
  regionName: string
  city: string
  zip: string
  lat: number
  lon: number
  timezone: string
  isp: string
  org: string
  as: string
}

interface IPInfo {
  location: IPLocation | null
  ispInfo: { name: string; type: string; domain: string } | null
  security: { isProxy: boolean; isVPN: boolean; isTor: boolean } | null
  error: string | null
}

const IPLookup = memo(function IPLookup() {
  const [inputIP, setInputIP] = useState('')
  const [ipInfo, setIpInfo] = useState<IPInfo>({
    location: null,
    ispInfo: null,
    security: null,
    error: null
  })
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<string[]>([])
  const [myIP, setMyIP] = useState<string>('')

  const fetchIPInfo = useCallback(async (ip: string) => {
    if (!ip.trim()) return

    setLoading(true)
    setIpInfo({ location: null, ispInfo: null, security: null, error: null })

    try {
      const response = await fetch(`https://ip-api.com/json/${encodeURIComponent(ip.trim())}`)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()

      if (data.status === 'fail') {
        throw new Error(data.message || '无法获取IP信息')
      }

      const location: IPLocation = {
        ip: data.query,
        country: data.country || '未知',
        countryCode: data.countryCode || '',
        region: data.region || '',
        regionName: data.regionName || '未知',
        city: data.city || '未知',
        zip: data.zip || '',
        lat: data.lat || 0,
        lon: data.lon || 0,
        timezone: data.timezone || '',
        isp: data.isp || '',
        org: data.org || '',
        as: data.as || ''
      }

      const ispInfo = {
        name: data.isp || '未知',
        type: data.org || '未知',
        domain: ''
      }

      const security = {
        isProxy: data.proxy || false,
        isVPN: false,
        isTor: false
      }

      setIpInfo({ location, ispInfo, security, error: null })

      setHistory(prev => {
        const newHistory = [ip.trim(), ...prev.filter(h => h !== ip.trim())].slice(0, 10)
        try {
          localStorage.setItem('weblinux-ip-history', JSON.stringify(newHistory))
        } catch { /* ignore */ }
        return newHistory
      })
    } catch (err) {
      console.error('IP lookup error:', err)
      setIpInfo({
        location: null,
        ispInfo: null,
        security: null,
        error: err instanceof Error ? err.message : '查询失败'
      })
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchMyIP = useCallback(async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json')
      if (!response.ok) throw new Error('获取失败')
      const data = await response.json()
      setMyIP(data.ip)
      fetchIPInfo(data.ip)
    } catch {
      console.warn('无法获取当前IP')
    }
  }, [fetchIPInfo])

  useEffect(() => {
    fetchMyIP()
    try {
      const saved = localStorage.getItem('weblinux-ip-history')
      if (saved) {
        setHistory(JSON.parse(saved))
      }
    } catch { /* ignore */ }
  }, [fetchMyIP])

  const getCountryFlag = (code: string): string => {
    const flagMap: Record<string, string> = {
      'CN': '🇨🇳', 'US': '🇺🇸', 'JP': '🇯🇵', 'KR': '🇰🇷', 'GB': '🇬🇧',
      'DE': '🇩🇪', 'FR': '🇫🇷', 'IT': '🇮🇹', 'ES': '🇪🇸', 'CA': '🇨🇦',
      'AU': '🇦🇺', 'RU': '🇷🇺', 'IN': '🇮🇳', 'BR': '🇧🇷', 'MX': '🇲🇽',
      'SG': '🇸🇬', 'HK': '🇭🇰', 'TW': '🇹🇼', 'TH': '🇹🇭', 'VN': '🇻🇳'
    }
    return flagMap[code] || '🌍'
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchIPInfo(inputIP)
  }

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      padding: '20px',
      overflow: 'auto'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ fontSize: '36px', marginBottom: '8px' }}>🌐</div>
        <h2 style={{ margin: 0, color: '#fff', fontSize: '20px', fontWeight: '600' }}>IP & DNS 查询工具</h2>
        <p style={{ margin: 0, color: '#94a3b8', fontSize: '14px' }}>查询IP地址的详细信息</p>
      </div>

      <form onSubmit={handleSubmit} style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input
            type="text"
            value={inputIP}
            onChange={(e) => setInputIP(e.target.value)}
            placeholder="输入IP地址（如 8.8.8.8）"
            style={{
              flex: 1,
              padding: '14px 18px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#fff',
              fontSize: '14px',
              outline: 'none'
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '14px 24px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              border: 'none',
              color: '#fff',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? '查询中...' : '🔍 查询'}
          </button>
        </div>
      </form>

      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={fetchMyIP}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '10px',
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            color: '#60a5fa',
            cursor: 'pointer',
            fontSize: '13px'
          }}
        >
          🌍 查询我的IP地址
        </button>
      </div>

      {history.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>历史记录：</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {history.map((ip, index) => (
              <button
                key={index}
                onClick={() => {
                  setInputIP(ip)
                  fetchIPInfo(ip)
                }}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#cbd5e1',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                {ip}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '16px',
          padding: '40px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
          <div style={{ color: '#94a3b8', fontSize: '16px' }}>正在查询...</div>
        </div>
      )}

      {!loading && ipInfo.error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          borderRadius: '16px',
          padding: '24px',
          textAlign: 'center',
          border: '1px solid rgba(239, 68, 68, 0.3)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
          <div style={{ color: '#ef4444', fontSize: '14px' }}>{ipInfo.error}</div>
        </div>
      )}

      {!loading && !ipInfo.error && ipInfo.location && (
        <div>
          <div style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '20px',
            border: '1px solid rgba(59, 130, 246, 0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ fontSize: '48px' }}>{getCountryFlag(ipInfo.location.countryCode)}</div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#fff' }}>
                  {ipInfo.location.ip}
                </div>
                <div style={{ fontSize: '14px', color: '#94a3b8' }}>
                  {ipInfo.location.city}, {ipInfo.location.regionName}, {ipInfo.location.country}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>📍 地理位置</div>
              <div style={{ fontSize: '14px', color: '#fff' }}>
                <div>城市: {ipInfo.location.city}</div>
                <div>地区: {ipInfo.location.regionName}</div>
                <div>国家: {ipInfo.location.country} {getCountryFlag(ipInfo.location.countryCode)}</div>
                <div>邮编: {ipInfo.location.zip || '-'}</div>
              </div>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>🌍 坐标信息</div>
              <div style={{ fontSize: '14px', color: '#fff' }}>
                <div>纬度: {ipInfo.location.lat.toFixed(4)}</div>
                <div>经度: {ipInfo.location.lon.toFixed(4)}</div>
                <div>时区: {ipInfo.location.timezone || '-'}</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>📡 ISP信息</div>
              <div style={{ fontSize: '14px', color: '#fff' }}>
                <div>ISP: {ipInfo.location.isp || '-'}</div>
                <div>组织: {ipInfo.location.org || '-'}</div>
                <div>AS号: {ipInfo.location.as || '-'}</div>
              </div>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>🛡️ 安全状态</div>
              <div style={{ fontSize: '14px', color: '#fff' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{ipInfo.security?.isProxy ? '⚠️' : '✅'}</span>
                  <span>{ipInfo.security?.isProxy ? '代理服务器' : '普通IP'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{ipInfo.security?.isVPN ? '⚠️' : '✅'}</span>
                  <span>{ipInfo.security?.isVPN ? 'VPN' : '非VPN'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{ipInfo.security?.isTor ? '⚠️' : '✅'}</span>
                  <span>{ipInfo.security?.isTor ? 'Tor网络' : '非Tor'}</span>
                </div>
              </div>
            </div>
          </div>

          {ipInfo.location.lat !== 0 && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>🗺️ 地图链接</div>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${ipInfo.location.lat},${ipInfo.location.lon}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  background: 'rgba(59, 130, 246, 0.2)',
                  color: '#60a5fa',
                  textDecoration: 'none',
                  fontSize: '13px'
                }}
              >
                在地图上查看位置
              </a>
            </div>
          )}
        </div>
      )}

      {!loading && !ipInfo.error && !ipInfo.location && myIP && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '16px',
          padding: '32px',
          textAlign: 'center',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌐</div>
          <div style={{ color: '#94a3b8', fontSize: '16px', marginBottom: '8px' }}>您的IP地址</div>
          <div style={{ color: '#fff', fontSize: '24px', fontWeight: '600' }}>{myIP}</div>
          <button
            onClick={() => {
              setInputIP(myIP)
              fetchIPInfo(myIP)
            }}
            style={{
              marginTop: '16px',
              padding: '10px 24px',
              borderRadius: '10px',
              background: 'rgba(59, 130, 246, 0.2)',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              color: '#60a5fa',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            查询详细信息
          </button>
        </div>
      )}
    </div>
  )
})

export default IPLookup