import { useState, useEffect, useCallback } from 'react'
import { useStore } from '../store'

// ==================== 类型定义 ====================
interface IPInfoData {
  ip: string
  city?: string
  region?: string
  country?: string
  country_name?: string
  continent_code?: string
  timezone?: string
  latitude?: number
  longitude?: number
  isp?: string
  org?: string
  asn?: string
  postal?: string
  currency?: string
  utc_offset?: string
}

// ==================== 常量 ====================
// 首选 ipapi.co（无需 key，CORS 友好）；错误时可回退到 ip-api.com
const PRIMARY_API = 'https://ipapi.co'
const FALLBACK_API = 'http://ip-api.com/json'

// ==================== 工具函数 ====================
function validateIP(ip: string): boolean {
  // IPv4
  const v4 = /^(25[0-5]|2[0-4]\d|[01]?\d?\d)(\.(25[0-5]|2[0-4]\d|[01]?\d?\d)){3}$/
  // IPv6 (简化校验)
  const v6 = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/
  return v4.test(ip.trim()) || v6.test(ip.trim())
}

function flagFromCountry(code?: string): string {
  if (!code || code.length !== 2) return '🌍'
  const A = 0x1f1e6
  const chars = code.toUpperCase().split('').map((c) => A + c.charCodeAt(0) - 'A'.charCodeAt(0))
  return String.fromCodePoint(...chars)
}

// ==================== 主组件 ====================
export default function IPLookup() {
  const [input, setInput] = useState<string>('')
  const [data, setData] = useState<IPInfoData | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<string[]>([])
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [source, setSource] = useState<string>('')

  const addNotification = useStore((s) => s.addNotification)

  // ========== 从 localStorage 载入历史 ==========
  useEffect(() => {
    try {
      const raw = localStorage.getItem('weblinux-ip-history')
      if (raw) setHistory(JSON.parse(raw))
    } catch { /* 忽略 */ }
  }, [])

  // ========== 保存历史 ==========
  const saveHistory = useCallback((next: string[]) => {
    try {
      localStorage.setItem('weblinux-ip-history', JSON.stringify(next))
    } catch { /* 忽略 */ }
  }, [])

  // ========== 查询 IP 信息 ==========
  const queryIP = useCallback(async (ip?: string) => {
    const target = (ip ?? input).trim()

    // 如果输入非空且非有效 IP，提示错误
    if (target && !validateIP(target)) {
      setError('请输入有效的 IPv4 / IPv6 地址')
      setData(null)
      return
    }

    setLoading(true)
    setError(null)
    setData(null)

    try {
      // 优先使用 ipapi.co
      const endpoint = target ? `${PRIMARY_API}/${encodeURIComponent(target)}/json/` : `${PRIMARY_API}/json/`
      const res = await fetch(endpoint)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const body: any = await res.json()

      // ipapi.co 在某些情况下返回 { error: true, reason: 'reserved range' }
      if (body && body.error) {
        throw new Error(body.reason || 'IP 查询失败')
      }
      if (!body || !body.ip) {
        throw new Error('返回数据无效')
      }

      setSource('ipapi.co')
      const info: IPInfoData = {
        ip: body.ip,
        city: body.city,
        region: body.region,
        country: body.country,
        country_name: body.country_name,
        continent_code: body.continent_code,
        timezone: body.timezone,
        latitude: body.latitude,
        longitude: body.longitude,
        isp: body.org || body.isp,
        org: body.org,
        asn: body.asn,
        postal: body.postal,
        currency: body.currency,
        utc_offset: body.utc_offset,
      }
      setData(info)
      setLastUpdated(new Date())

      // 加入历史（去重，最多保留 10 条）
      if (info.ip) {
        setHistory((prev) => {
          const next = [info.ip, ...prev.filter((h) => h !== info.ip)].slice(0, 10)
          saveHistory(next)
          return next
        })
      }
    } catch (primaryErr) {
      // 尝试回退到 ip-api.com（需要注意其在 HTTPS 下不可用）
      try {
        const endpoint = target ? `${FALLBACK_API}/${encodeURIComponent(target)}` : FALLBACK_API
        const res = await fetch(endpoint)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const body: any = await res.json()
        if (body.status !== 'success') {
          throw new Error(body.message || '查询失败')
        }
        setSource('ip-api.com')
        const info: IPInfoData = {
          ip: body.query,
          city: body.city,
          region: body.regionName,
          country: body.countryCode,
          country_name: body.country,
          continent_code: body.continent,
          timezone: body.timezone,
          latitude: body.lat,
          longitude: body.lon,
          isp: body.isp,
          org: body.org,
          asn: body.as,
          postal: body.zip,
          currency: undefined,
          utc_offset: undefined,
        }
        setData(info)
        setLastUpdated(new Date())
        if (info.ip) {
          setHistory((prev) => {
            const next = [info.ip, ...prev.filter((h) => h !== info.ip)].slice(0, 10)
            saveHistory(next)
            return next
          })
        }
      } catch (fallbackErr) {
        const msg = primaryErr instanceof Error ? primaryErr.message : '请求失败'
        setError(`IP 信息查询失败：${msg}`)
        addNotification({ title: 'IP 查询', message: 'IP 信息查询失败', type: 'error' })
      }
    } finally {
      setLoading(false)
    }
  }, [input, addNotification, saveHistory])

  // 页面加载时自动查询当前 IP
  useEffect(() => {
    queryIP('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // IP 输入框回车触发查询
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    queryIP()
  }

  // 复制到剪贴板
  const copyToClipboard = useCallback((text: string, label: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(
          () => addNotification({ title: 'IP 查询', message: `${label} 已复制`, type: 'success' }),
          () => addNotification({ title: 'IP 查询', message: '复制失败', type: 'error' })
        )
      } else {
        // 回退方案
        const ta = document.createElement('textarea')
        ta.value = text
        ta.style.position = 'fixed'
        ta.style.top = '-1000px'
        document.body.appendChild(ta)
        ta.select()
        try {
          const success = document.execCommand('copy')
          if (success) {
            addNotification({ title: 'IP 查询', message: `${label} 已复制`, type: 'success' })
          } else {
            addNotification({ title: 'IP 查询', message: '复制失败', type: 'error' })
          }
        } finally {
          document.body.removeChild(ta)
        }
      }
    } catch {
      addNotification({ title: 'IP 查询', message: '复制失败', type: 'error' })
    }
  }, [addNotification])

  return (
    <div className="app-shell" style={{ height: '100%', overflowY: 'auto', padding: 16, background: 'linear-gradient(135deg, #0d1b2a 0%, #1b263b 100%)', color: '#fff' }}>
      {/* 顶部标题 */}
      <div className="app-card" style={{ padding: 16, marginBottom: 14, borderRadius: 12, background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(124, 108, 240, 0.15))', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{ fontSize: 28 }}>🌐</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>IP 地理位置查询</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>
              数据来源：{source || 'ipapi.co'}
              {lastUpdated && ` · 更新于 ${lastUpdated.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`}
            </div>
          </div>
        </div>

        {/* 查询表单 */}
        <form onSubmit={onSubmit} style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <input
            className="app-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入 IP 地址（留空查询当前 IP）"
            style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(0,0,0,0.25)', color: '#fff', fontSize: 14, outline: 'none' }}
          />
          <button
            className="app-button-primary"
            type="submit"
            disabled={loading}
            style={{ padding: '10px 20px', borderRadius: 8, background: 'linear-gradient(135deg, #3b82f6, #7c6cf0)', color: '#fff', border: 'none', cursor: loading ? 'wait' : 'pointer', fontSize: 13, fontWeight: 600 }}
          >
            {loading ? '查询中...' : '🔍 查询'}
          </button>
        </form>

        <div style={{ display: 'flex', gap: 10, marginTop: 10, alignItems: 'center' }}>
          <button
            className="app-button"
            onClick={() => { setInput(''); queryIP('') }}
            disabled={loading}
            style={{ padding: '6px 12px', borderRadius: 20, border: '1px solid rgba(59, 130, 246, 0.4)', background: 'rgba(59, 130, 246, 0.12)', color: '#93c5fd', cursor: loading ? 'wait' : 'pointer', fontSize: 12 }}
          >
            查询当前 IP
          </button>
          {input && (
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>
              {validateIP(input) ? '✓ 格式有效' : '✗ 格式不正确'}
            </span>
          )}
        </div>
      </div>

      {/* 历史记录 */}
      {history.length > 0 && (
        <div className="app-card" style={{ padding: 12, marginBottom: 14, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginBottom: 8 }}>历史记录：</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {history.map((h) => (
              <button
                key={h}
                className="chip"
                onClick={() => { setInput(h); queryIP(h) }}
                style={{ padding: '5px 12px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#cbd5e1', cursor: 'pointer', fontSize: 12, fontFamily: 'monospace' }}
              >
                {h}
              </button>
            ))}
            <button
              className="app-button"
              onClick={() => { setHistory([]); saveHistory([]) }}
              style={{ padding: '5px 10px', borderRadius: 14, background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', cursor: 'pointer', fontSize: 11 }}
            >
              清空
            </button>
          </div>
        </div>
      )}

      {/* 错误提示 */}
      {error && !loading && (
        <div className="app-card" style={{ padding: 12, marginBottom: 14, borderRadius: 10, background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#fca5a5', fontSize: 13 }}>
          ⚠️ {error}
        </div>
      )}

      {/* Loading 状态 */}
      {loading && (
        <div className="app-card" style={{ padding: 28, textAlign: 'center', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: 36, marginBottom: 8, animation: 'spin 1.2s linear infinite' }}>🔍</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>正在查询 IP 信息...</div>
        </div>
      )}

      {/* 数据展示 */}
      {data && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* 头部：IP + 国旗 */}
          <div className="app-card" style={{ padding: 20, borderRadius: 14, background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(124, 108, 240, 0.12))', border: '1px solid rgba(59, 130, 246, 0.35)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ fontSize: 44 }}>{flagFromCountry(data.country)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', fontFamily: 'monospace', letterSpacing: 0.5 }}>{data.ip}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
                  {[data.city, data.region, data.country_name || data.country].filter(Boolean).join(' · ')}
                </div>
              </div>
              <button
                className="app-button"
                onClick={() => copyToClipboard(data.ip, 'IP 地址')}
                style={{ padding: '6px 12px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', color: '#fff', cursor: 'pointer', fontSize: 12 }}
              >
                复制 IP
              </button>
            </div>
          </div>

          {/* 详细信息网格 */}
          <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
            <InfoCell icon="🏙️" label="城市" value={data.city} onCopy={() => copyToClipboard(data.city || '', '城市')} />
            <InfoCell icon="📍" label="行政区 / 州" value={data.region} onCopy={() => copyToClipboard(data.region || '', '行政区')} />
            <InfoCell icon="🏳️" label="国家" value={data.country_name || data.country} onCopy={() => copyToClipboard(data.country_name || data.country || '', '国家')} />
            <InfoCell icon="🌍" label="大洲" value={data.continent_code} onCopy={() => copyToClipboard(data.continent_code || '', '大洲')} />
            <InfoCell icon="🕐" label="时区" value={data.timezone} onCopy={() => copyToClipboard(data.timezone || '', '时区')} />
            <InfoCell icon="💰" label="货币代码" value={data.currency} onCopy={() => copyToClipboard(data.currency || '', '货币')} />
            <InfoCell icon="🌐" label="UTC 偏移" value={data.utc_offset} onCopy={() => copyToClipboard(data.utc_offset || '', 'UTC 偏移')} />
            <InfoCell icon="📮" label="邮政编码" value={data.postal} onCopy={() => copyToClipboard(data.postal || '', '邮政编码')} />
            <InfoCell icon="📡" label="ISP（运营商）" value={data.isp} onCopy={() => copyToClipboard(data.isp || '', 'ISP')} />
            <InfoCell icon="🏢" label="组织" value={data.org} onCopy={() => copyToClipboard(data.org || '', '组织')} />
            <InfoCell icon="🔢" label="ASN" value={data.asn} onCopy={() => copyToClipboard(data.asn || '', 'ASN')} />
          </div>

          {/* 经纬度 + 地图链接 */}
          <div className="app-card" style={{ padding: 14, borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 8 }}>📍 坐标信息</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div
                onClick={() => copyToClipboard(String(data.latitude ?? ''), '纬度')}
                style={{ padding: 10, borderRadius: 8, background: 'rgba(0,0,0,0.25)', cursor: 'pointer', fontSize: 13, fontFamily: 'monospace' }}
              >
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>纬度 Latitude</div>
                {data.latitude !== undefined && data.latitude !== null ? data.latitude.toFixed(4) : '—'}
              </div>
              <div
                onClick={() => copyToClipboard(String(data.longitude ?? ''), '经度')}
                style={{ padding: 10, borderRadius: 8, background: 'rgba(0,0,0,0.25)', cursor: 'pointer', fontSize: 13, fontFamily: 'monospace' }}
              >
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>经度 Longitude</div>
                {data.longitude !== undefined && data.longitude !== null ? data.longitude.toFixed(4) : '—'}
              </div>
            </div>
            {data.latitude !== undefined && data.longitude !== undefined && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${data.latitude},${data.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-block', marginTop: 12, padding: '7px 14px', borderRadius: 14, background: 'rgba(59, 130, 246, 0.2)', border: '1px solid rgba(59, 130, 246, 0.4)', color: '#93c5fd', fontSize: 12, textDecoration: 'none' }}
              >
                🗺️ 在 Google Maps 中查看
              </a>
            )}
          </div>
        </div>
      )}

      {/* 空状态 */}
      {!data && !loading && !error && (
        <div style={{ textAlign: 'center', padding: 48, color: 'rgba(255,255,255,0.55)' }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🌐</div>
          <div style={{ fontSize: 14 }}>输入 IP 地址后点击查询，或直接查询当前 IP</div>
        </div>
      )}
    </div>
  )
}

// 信息单元格子组件
function InfoCell({ icon, label, value, onCopy }: { icon: string; label: string; value?: string; onCopy?: () => void }) {
  const [copied, setCopied] = useState(false)
  const handleClick = () => {
    if (!value) return
    onCopy?.()
    setCopied(true)
    setTimeout(() => setCopied(false), 1000)
  }
  return (
    <div
      onClick={handleClick}
      className="app-card"
      style={{
        padding: 12,
        borderRadius: 10,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.07)',
        cursor: value ? 'pointer' : 'default',
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => { if (value) e.currentTarget.style.background = 'rgba(255,255,255,0.075)' }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
    >
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginBottom: 4 }}>
        {icon} {label}
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', minHeight: 20, wordBreak: 'break-all' }}>
        {value || '—'}
      </div>
      {value && (
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>
          {copied ? '✓ 已复制' : '点击复制'}
        </div>
      )}
    </div>
  )
}
