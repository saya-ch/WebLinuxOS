import { useState, useCallback } from 'react'

interface IPInfo {
  ip: string
  city: string
  region: string
  country: string
  country_name: string
  latitude: number
  longitude: number
  timezone: string
  isp: string
  org: string
  asn: string
  currency: string
  currency_name: string
  languages: string
  in_eu: boolean
  postal: string
  calling_code: string
}

export default function IPLookup() {
  const [ipInfo, setIpInfo] = useState<IPInfo | null>(null)
  const [searchIp, setSearchIp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<string[]>([])

  const fetchIPInfo = useCallback(async (ip?: string) => {
    setLoading(true)
    setError(null)
    try {
      const url = ip 
        ? `https://ipapi.co/${ip}/json/`
        : `https://ipapi.co/json/`
      const response = await fetch(url)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '网络请求失败')
      }
      const data = await response.json()
      setIpInfo(data)
      
      // 添加到历史记录
      if (data.ip) {
        setHistory(prev => {
          const filtered = prev.filter(h => h !== data.ip)
          return [data.ip, ...filtered].slice(0, 10)
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取IP信息失败')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleSearch = () => {
    const ip = searchIp.trim()
    if (ip) {
      fetchIPInfo(ip)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleGetCurrentIP = () => {
    setSearchIp('')
    fetchIPInfo()
  }

  return (
    <div className="app-container" style={{ 
      background: 'var(--window-bg)', 
      padding: 20, 
      overflow: 'auto',
      height: '100%'
    }}>
      {/* 标题 */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)' }}>
          🌐 IP 地址查询
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
          查询IP地理位置和网络信息
        </div>
      </div>

      {/* 搜索框 */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            value={searchIp}
            onChange={(e) => setSearchIp(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入IP地址 (如: 8.8.8.8)"
            style={{
              flex: 1,
              padding: '12px 16px',
              background: 'var(--window-bg)',
              border: '1px solid var(--window-border)',
              borderRadius: 8,
              color: 'var(--text-primary)',
              fontSize: 14,
              outline: 'none',
            }}
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            style={{
              padding: '12px 20px',
              background: 'var(--accent)',
              border: 'none',
              borderRadius: 8,
              color: '#fff',
              fontSize: 14,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            查询
          </button>
        </div>
        <button
          onClick={handleGetCurrentIP}
          style={{
            marginTop: 8,
            width: '100%',
            padding: '10px 16px',
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid var(--window-border)',
            borderRadius: 8,
            color: 'var(--text-primary)',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          📍 查询当前IP
        </button>
      </div>

      {/* 加载状态 */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
          <div style={{ color: 'var(--text-secondary)' }}>正在查询...</div>
        </div>
      )}

      {/* 错误状态 */}
      {error && (
        <div style={{ 
          textAlign: 'center', 
          padding: 20,
          background: 'rgba(244,71,71,0.1)',
          borderRadius: 8,
          marginBottom: 16
        }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>❌</div>
          <div style={{ color: '#f44747' }}>{error}</div>
        </div>
      )}

      {/* IP信息 */}
      {ipInfo && !loading && (
        <div style={{ marginBottom: 20 }}>
          {/* IP地址 */}
          <div style={{ 
            background: 'var(--accent-bg)', 
            borderRadius: 12, 
            padding: 16,
            textAlign: 'center',
            marginBottom: 16
          }}>
            <div style={{ fontSize: 32, fontWeight: 600, color: 'var(--accent)' }}>
              {ipInfo.ip}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
              {ipInfo.isp}
            </div>
          </div>

          {/* 基本信息 */}
          <div style={{ 
            background: 'rgba(255,255,255,0.05)', 
            borderRadius: 12, 
            padding: 16,
            marginBottom: 12
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: 'var(--text-primary)' }}>
              📍 地理位置
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>城市</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{ipInfo.city || '未知'}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>地区</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{ipInfo.region || '未知'}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>国家</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{ipInfo.country_name || ipInfo.country || '未知'}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>邮编</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{ipInfo.postal || '未知'}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>经度</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{ipInfo.longitude?.toFixed(4) || '未知'}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>纬度</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{ipInfo.latitude?.toFixed(4) || '未知'}</div>
              </div>
            </div>
          </div>

          {/* 网络信息 */}
          <div style={{ 
            background: 'rgba(255,255,255,0.05)', 
            borderRadius: 12, 
            padding: 16,
            marginBottom: 12
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: 'var(--text-primary)' }}>
              🔗 网络信息
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>ISP</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{ipInfo.isp || '未知'}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>组织</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{ipInfo.org || '未知'}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>ASN</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{ipInfo.asn || '未知'}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>时区</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{ipInfo.timezone || '未知'}</div>
              </div>
            </div>
          </div>

          {/* 其他信息 */}
          <div style={{ 
            background: 'rgba(255,255,255,0.05)', 
            borderRadius: 12, 
            padding: 16
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: 'var(--text-primary)' }}>
              💼 其他信息
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>货币</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>
                  {ipInfo.currency_name || ipInfo.currency || '未知'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>语言</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{ipInfo.languages || '未知'}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>国际区号</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{ipInfo.calling_code || '未知'}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>欧盟成员</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>
                  {ipInfo.in_eu ? '是' : '否'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 历史记录 */}
      {history.length > 0 && (
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: 'var(--text-primary)' }}>
            查询历史
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {history.map((ip, i) => (
              <div
                key={i}
                onClick={() => {
                  setSearchIp(ip)
                  fetchIPInfo(ip)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '10px 12px',
                  background: 'rgba(255,255,255,0.04)',
                  borderRadius: 8,
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
              >
                <span style={{ fontSize: 16, marginRight: 8 }}>🌐</span>
                <span style={{ fontWeight: 500 }}>{ip}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 数据来源 */}
      <div style={{ textAlign: 'center', marginTop: 16, fontSize: 11, color: 'var(--text-secondary)' }}>
        数据来源: ipapi.co
      </div>
    </div>
  )
}