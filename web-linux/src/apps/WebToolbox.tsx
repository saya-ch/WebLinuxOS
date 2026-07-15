import { useState, useCallback } from 'react'
import { useStore } from '../store'

// ==================== 类型定义 ====================
interface IPInfo {
  ip: string
  city?: string
  region?: string
  country_name?: string
  latitude?: number
  longitude?: number
  timezone?: string
  org?: string
  asn?: string
  postal?: string
  currency?: string
}

interface DNSRecord {
  name: string
  type: number
  TTL: number
  data: string
}

interface RandomUser {
  name: { title: string; first: string; last: string }
  email: string
  phone: string
  location: { city: string; country: string }
  picture: { large: string; medium: string }
  login: { username: string }
  nat: string
}

interface ExchangeRate {
  base: string
  rates: Record<string, number>
}

type TabId = 'ip' | 'dns' | 'shorturl' | 'avatar' | 'exchange' | 'ascii'

interface TabConfig {
  id: TabId
  name: string
  icon: string
}

const TABS: TabConfig[] = [
  { id: 'ip', name: 'IP查询', icon: '🌐' },
  { id: 'dns', name: 'DNS查询', icon: '🔍' },
  { id: 'shorturl', name: '短链生成', icon: '🔗' },
  { id: 'avatar', name: '随机头像', icon: '👤' },
  { id: 'exchange', name: '汇率查询', icon: '💱' },
  { id: 'ascii', name: 'ASCII艺术', icon: '🎨' },
]

// ==================== ASCII 艺术生成器 ====================
const ASCII_FONTS: Record<string, Record<string, string[]>> = {
  block: {
    A: ['  ██  ', ' █  █ ', '██████', '█    █', '█    █'],
    B: ['█████ ', '█    █', '█████ ', '█    █', '█████ '],
    C: [' █████', '█     ', '█     ', '█     ', ' █████'],
    D: ['█████ ', '█    █', '█    █', '█    █', '█████ '],
    E: ['██████', '█     ', '████  ', '█     ', '██████'],
    F: ['██████', '█     ', '████  ', '█     ', '█     '],
    G: [' █████', '█     ', '█  ███', '█    █', ' █████'],
    H: ['█    █', '█    █', '██████', '█    █', '█    █'],
    I: ['██████', '  ██  ', '  ██  ', '  ██  ', '██████'],
    J: ['██████', '    █ ', '    █ ', '█   █ ', ' ███  '],
    K: ['█   █ ', '█  █  ', '███   ', '█  █  ', '█   █ '],
    L: ['█     ', '█     ', '█     ', '█     ', '██████'],
    M: ['█    █', '██  ██', '█ ██ █', '█    █', '█    █'],
    N: ['█    █', '██   █', '█ █  █', '█  █ █', '█   ██'],
    O: [' ████ ', '█    █', '█    █', '█    █', ' ████ '],
    P: ['█████ ', '█    █', '█████ ', '█     ', '█     '],
    Q: [' ████ ', '█    █', '█  █ █', '█   █ ', ' ███ █'],
    R: ['█████ ', '█    █', '█████ ', '█  █  ', '█   █ '],
    S: [' █████', '█     ', ' ████ ', '     █', '█████ '],
    T: ['██████', '  ██  ', '  ██  ', '  ██  ', '  ██  '],
    U: ['█    █', '█    █', '█    █', '█    █', ' ████ '],
    V: ['█    █', '█    █', ' █  █ ', ' █  █ ', '  ██  '],
    W: ['█    █', '█    █', '█ ██ █', '██  ██', '█    █'],
    X: ['█    █', ' █  █ ', '  ██  ', ' █  █ ', '█    █'],
    Y: ['█    █', ' █  █ ', '  ██  ', '  ██  ', '  ██  '],
    Z: ['██████', '   █  ', '  █   ', ' █    ', '██████'],
    ' ': ['      ', '      ', '      ', '      ', '      '],
    '0': [' ████ ', '█   ██', '█  █ █', '█ █  █', ' ████ '],
    '1': ['  █   ', ' ██   ', '  █   ', '  █   ', ' ███  '],
    '2': [' ████ ', '█    █', '   █  ', '  █   ', '██████'],
    '3': ['█████ ', '    █ ', ' ███  ', '    █ ', '█████ '],
    '4': ['█   █ ', '█   █ ', '██████', '    █ ', '    █ '],
    '5': ['██████', '█     ', '█████ ', '     █', '█████ '],
    '6': [' ████ ', '█     ', '█████ ', '█    █', ' ████ '],
    '7': ['██████', '    █ ', '   █  ', '  █   ', '  █   '],
    '8': [' ████ ', '█    █', ' ████ ', '█    █', ' ████ '],
    '9': [' ████ ', '█    █', ' █████', '     █', ' ████ '],
  },
  shadow: {
    A: ['  ___  ', ' / _ \\ ', '| |_| |', '|  _  |', '|_| |_|'],
    B: ['|___  |', '   / / ', '  / /  ', ' / /__ ', '/_____|'],
    C: [' ____  ', '/ ___| ', '|      ', '|      ', '\\____|'],
    D: ['|___ \\ ', '  __) |', ' / __/ ', '|_____|', '       '],
    E: [' _____ ', '| ___ |', '| __  |', '|___  |', '|_____|'],
    F: [' _____ ', '|  ___|', '| |_   ', '|  _|  ', '|_|    '],
    G: [' _____ ', '/  ___|', '| /___ ', '| ___ \\', '|_____/'],
    H: ['|     |', '|     |', '|_____|', '|     |', '|     |'],
    I: [' _____ ', '|_   _|', '  | |  ', '  | |  ', ' _____ '],
    J: [' _____ ', '|_   _|', '  | |  ', '  | |  ', '|___|  '],
    K: ['|  /  |', '| /   |', '|/    |', '|\\    |', '| \\   |'],
    L: ['|     |', '|     |', '|     |', '|     |', '|_____|'],
    M: ['|\\   /|', '| \\ / |', '|  V  |', '|     |', '|     |'],
    N: ['|\\    |', '| \\   |', '|  \\  |', '|   \\ |', '|    \\|'],
    O: [' ____  ', '/    \\ ', '| () | ', '\\____/ ', '       '],
    P: ['|____  ', '     / ', '    /  ', '   /   ', '  /    '],
    Q: [' ____  ', '/    \\ ', '| () | ', '\\____\\\\', '       '],
    R: ['|____  ', '     / ', '    /  ', '   /   ', '  / /  '],
    S: [' ____  ', '/ ___| ', '\\___ \\ ', ' ___| |', '|_____/'],
    T: ['_______', '  | |  ', '  | |  ', '  | |  ', '  |_|  '],
    U: ['|     |', '|     |', '|     |', '|     |', '|_____|'],
    V: ['|     |', '|     |', ' \\   / ', '  \\ /  ', '   V   '],
    W: ['|     |', '|     |', '|  |  |', '|  |  |', ' \\_/ \\_'],
    X: ['|     |', ' \\   / ', '  \\ /  ', '  / \\  ', ' /   \\ '],
    Y: ['|     |', ' \\   / ', '  \\ /  ', '   |   ', '   |   '],
    Z: ['_______', '    /  ', '   /   ', '  /    ', '/_____ '],
    ' ': ['       ', '       ', '       ', '       ', '       '],
  },
}

function generateAsciiArt(text: string, font: string): string {
  const fontData = ASCII_FONTS[font] || ASCII_FONTS.block
  const upper = text.toUpperCase()
  const rows: string[] = ['', '', '', '', '']
  for (const ch of upper) {
    const charData = fontData[ch]
    if (charData) {
      for (let r = 0; r < 5; r++) {
        rows[r] += charData[r]
      }
    } else {
      for (let r = 0; r < 5; r++) {
        rows[r] += '   '
      }
    }
  }
  return rows.join('\n')
}

// ==================== 主组件 ====================
export default function WebToolbox() {
  const [activeTab, setActiveTab] = useState<TabId>('ip')
  const addNotification = useStore((s) => s.addNotification)

  // ---- IP查询状态 ----
  const [ipLoading, setIpLoading] = useState(false)
  const [ipError, setIpError] = useState<string | null>(null)
  const [ipData, setIpData] = useState<IPInfo | null>(null)
  const [ipInput, setIpInput] = useState('')

  // ---- DNS查询状态 ----
  const [dnsLoading, setDnsLoading] = useState(false)
  const [dnsError, setDnsError] = useState<string | null>(null)
  const [dnsRecords, setDnsRecords] = useState<DNSRecord[]>([])
  const [dnsInput, setDnsInput] = useState('')
  const [dnsType, setDnsType] = useState('A')

  // ---- 短链生成状态 ----
  const [urlLoading, setUrlLoading] = useState(false)
  const [urlError, setUrlError] = useState<string | null>(null)
  const [shortUrl, setShortUrl] = useState('')
  const [urlInput, setUrlInput] = useState('')

  // ---- 随机头像状态 ----
  const [avatarLoading, setAvatarLoading] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [avatarData, setAvatarData] = useState<RandomUser | null>(null)

  // ---- 汇率查询状态 ----
  const [rateLoading, setRateLoading] = useState(false)
  const [rateError, setRateError] = useState<string | null>(null)
  const [rateData, setRateData] = useState<ExchangeRate | null>(null)
  const [rateAmount, setRateAmount] = useState('1')
  const [rateFrom, setRateFrom] = useState('USD')
  const [rateTo, setRateTo] = useState('CNY')
  const [rateResult, setRateResult] = useState<string | null>(null)

  // ---- ASCII艺术状态 ----
  const [asciiInput, setAsciiInput] = useState('HELLO')
  const [asciiFont, setAsciiFont] = useState('block')

  // ==================== IP查询 ====================
  const queryIP = useCallback(async () => {
    setIpLoading(true)
    setIpError(null)
    setIpData(null)
    try {
      const endpoint = ipInput.trim()
        ? `https://ipapi.co/${encodeURIComponent(ipInput.trim())}/json/`
        : 'https://ipapi.co/json/'
      const res = await fetch(endpoint)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const body = await res.json()
      if (body.error) throw new Error(body.reason || '查询失败')
      setIpData({
        ip: body.ip,
        city: body.city,
        region: body.region,
        country_name: body.country_name,
        latitude: body.latitude,
        longitude: body.longitude,
        timezone: body.timezone,
        org: body.org,
        asn: body.asn,
        postal: body.postal,
        currency: body.currency,
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : '请求失败'
      setIpError(msg)
      addNotification({ title: '工具箱', message: 'IP查询失败', type: 'error' })
    } finally {
      setIpLoading(false)
    }
  }, [ipInput, addNotification])

  // ==================== DNS查询 ====================
  const queryDNS = useCallback(async () => {
    const domain = dnsInput.trim()
    if (!domain) return
    setDnsLoading(true)
    setDnsError(null)
    setDnsRecords([])
    try {
      const res = await fetch(
        `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=${dnsType}`
      )
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const body = await res.json()
      if (body.Status === 3) throw new Error('域名不存在 (NXDOMAIN)')
      if (body.Answer && body.Answer.length > 0) {
        setDnsRecords(body.Answer)
      } else {
        setDnsError('未找到相关DNS记录')
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '请求失败'
      setDnsError(msg)
      addNotification({ title: '工具箱', message: 'DNS查询失败', type: 'error' })
    } finally {
      setDnsLoading(false)
    }
  }, [dnsInput, dnsType, addNotification])

  // ==================== 短链生成 ====================
  const generateShortUrl = useCallback(async () => {
    const url = urlInput.trim()
    if (!url) return
    setUrlLoading(true)
    setUrlError(null)
    setShortUrl('')
    try {
      const res = await fetch(
        `https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`
      )
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const text = await res.text()
      if (text.startsWith('Error')) throw new Error(text)
      setShortUrl(text)
    } catch (err) {
      const msg = err instanceof Error ? err.message : '请求失败'
      setUrlError(msg)
      addNotification({ title: '工具箱', message: '短链生成失败', type: 'error' })
    } finally {
      setUrlLoading(false)
    }
  }, [urlInput, addNotification])

  // ==================== 随机头像 ====================
  const fetchRandomUser = useCallback(async () => {
    setAvatarLoading(true)
    setAvatarError(null)
    try {
      const res = await fetch('https://randomuser.me/api/')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const body = await res.json()
      if (body.results && body.results.length > 0) {
        setAvatarData(body.results[0])
      } else {
        throw new Error('未获取到数据')
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '请求失败'
      setAvatarError(msg)
      addNotification({ title: '工具箱', message: '获取随机头像失败', type: 'error' })
    } finally {
      setAvatarLoading(false)
    }
  }, [addNotification])

  // ==================== 汇率查询 ====================
  const fetchExchangeRate = useCallback(async () => {
    setRateLoading(true)
    setRateError(null)
    setRateResult(null)
    try {
      const res = await fetch(`https://open.er-api.com/v6/latest/${rateFrom}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const body = await res.json()
      if (body.result === 'error') throw new Error(body['error-type'] || '查询失败')
      setRateData({ base: body.base_code, rates: body.rates })
      const amount = parseFloat(rateAmount) || 1
      const rate = body.rates[rateTo]
      if (rate) {
        setRateResult(`${amount} ${rateFrom} = ${(amount * rate).toFixed(4)} ${rateTo}`)
      } else {
        throw new Error(`不支持 ${rateTo} 货币`)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '请求失败'
      setRateError(msg)
      addNotification({ title: '工具箱', message: '汇率查询失败', type: 'error' })
    } finally {
      setRateLoading(false)
    }
  }, [rateFrom, rateTo, rateAmount, addNotification])

  // ==================== 复制到剪贴板 ====================
  const copyText = useCallback((text: string, label: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text)
      } else {
        const ta = document.createElement('textarea')
        ta.value = text
        ta.style.position = 'fixed'
        ta.style.top = '-1000px'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
      addNotification({ title: '工具箱', message: `${label} 已复制`, type: 'success' })
    } catch {
      addNotification({ title: '工具箱', message: '复制失败', type: 'error' })
    }
  }, [addNotification])

  // ==================== 通用样式 ====================
  const s = {
    container: {
      height: '100%' as const,
      overflowY: 'auto' as const,
      overflowX: 'hidden' as const,
      padding: 16,
      background: 'linear-gradient(180deg, var(--window-bg) 0%, var(--desktop-bg) 100%)',
      color: 'var(--text-primary)',
    },
    card: {
      padding: 18,
      borderRadius: 14,
      background: 'var(--glass-bg)',
      border: '1px solid var(--glass-border)',
      backdropFilter: 'blur(10px)',
    },
    input: {
      flex: 1,
      padding: '10px 14px',
      borderRadius: 10,
      border: '1px solid var(--glass-border)',
      background: 'rgba(0,0,0,0.2)',
      color: 'var(--text-primary)',
      fontSize: 13,
      outline: 'none',
      transition: 'border-color 0.2s ease',
    },
    btnPrimary: {
      padding: '10px 20px',
      borderRadius: 10,
      background: 'var(--accent-gradient, linear-gradient(135deg, #7c6cf0, #9b8af0))',
      color: '#fff',
      border: 'none',
      cursor: 'pointer',
      fontSize: 13,
      fontWeight: 600,
      transition: 'all 0.2s ease',
      display: 'flex' as const,
      alignItems: 'center' as const,
      gap: 6,
    },
    btnSecondary: {
      padding: '8px 16px',
      borderRadius: 10,
      border: '1px solid var(--glass-border)',
      background: 'var(--glass-bg)',
      color: 'var(--text-primary)',
      cursor: 'pointer',
      fontSize: 12,
      transition: 'all 0.2s ease',
    },
    errorBox: {
      padding: 12,
      borderRadius: 10,
      background: 'var(--error-bg)',
      border: '1px solid var(--error)',
      color: 'var(--error)',
      fontSize: 13,
    },
    loadingBox: {
      textAlign: 'center' as const,
      padding: 32,
      color: 'var(--text-secondary)',
    },
    label: {
      fontSize: 12,
      fontWeight: 600,
      color: 'var(--text-secondary)',
      marginBottom: 8,
      display: 'block',
    },
    resultRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '10px 14px',
      borderRadius: 8,
      background: 'rgba(0,0,0,0.15)',
      marginBottom: 6,
    },
  }

  // ==================== 渲染各工具面板 ====================
  const renderIPPanel = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={s.card}>
        <label style={s.label}>🌐 IP地址查询</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="app-input"
            style={s.input}
            type="text"
            value={ipInput}
            onChange={(e) => setIpInput(e.target.value)}
            placeholder="输入IP地址（留空查询当前IP）"
            aria-label="IP地址输入"
            onKeyDown={(e) => e.key === 'Enter' && queryIP()}
          />
          <button
            className="app-button"
            style={s.btnPrimary}
            onClick={queryIP}
            disabled={ipLoading}
            aria-label="查询IP"
          >
            {ipLoading ? '查询中...' : '🔍 查询'}
          </button>
        </div>
      </div>

      {ipError && <div style={s.errorBox}>⚠️ {ipError}</div>}

      {ipLoading && (
        <div style={s.loadingBox}>
          <div style={{ fontSize: 32, animation: 'spin 1.2s linear infinite', marginBottom: 8 }}>🌐</div>
          <div>正在查询IP信息...</div>
        </div>
      )}

      {ipData && !ipLoading && (
        <div style={{ ...s.card, background: 'linear-gradient(135deg, rgba(124,108,240,0.12), rgba(155,138,240,0.06))' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{ fontSize: 36 }}>🌐</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'monospace' }}>{ipData.ip}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                {[ipData.city, ipData.region, ipData.country_name].filter(Boolean).join(' · ')}
              </div>
            </div>
            <button className="app-button" style={s.btnSecondary} onClick={() => copyText(ipData.ip, 'IP地址')}>
              复制
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
            {[
              { label: '城市', value: ipData.city },
              { label: '地区', value: ipData.region },
              { label: '国家', value: ipData.country_name },
              { label: '时区', value: ipData.timezone },
              { label: '邮编', value: ipData.postal },
              { label: '运营商', value: ipData.org },
              { label: 'ASN', value: ipData.asn },
              { label: '货币', value: ipData.currency },
              { label: '坐标', value: ipData.latitude && ipData.longitude ? `${ipData.latitude}, ${ipData.longitude}` : '' },
            ].filter((item) => item.value).map((item) => (
              <div key={item.label} style={s.resultRow}>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{item.label}</span>
                <span style={{ fontSize: 12, fontWeight: 600, wordBreak: 'break-all' }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  const renderDNSPanel = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={s.card}>
        <label style={s.label}>🔍 DNS记录查询</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            className="app-input"
            style={{ ...s.input, minWidth: 200 }}
            type="text"
            value={dnsInput}
            onChange={(e) => setDnsInput(e.target.value)}
            placeholder="输入域名，如 example.com"
            aria-label="DNS查询域名"
            onKeyDown={(e) => e.key === 'Enter' && queryDNS()}
          />
          <select
            value={dnsType}
            onChange={(e) => setDnsType(e.target.value)}
            aria-label="DNS记录类型"
            style={{
              padding: '10px 12px',
              borderRadius: 10,
              border: '1px solid var(--glass-border)',
              background: 'rgba(0,0,0,0.2)',
              color: 'var(--text-primary)',
              fontSize: 13,
              outline: 'none',
            }}
          >
            {['A', 'AAAA', 'MX', 'CNAME', 'TXT', 'NS', 'SOA'].map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <button className="app-button" style={s.btnPrimary} onClick={queryDNS} disabled={dnsLoading} aria-label="查询DNS">
            {dnsLoading ? '查询中...' : '🔍 查询'}
          </button>
        </div>
      </div>

      {dnsError && <div style={s.errorBox}>⚠️ {dnsError}</div>}

      {dnsLoading && (
        <div style={s.loadingBox}>
          <div style={{ fontSize: 32, animation: 'spin 1.2s linear infinite', marginBottom: 8 }}>🔍</div>
          <div>正在查询DNS记录...</div>
        </div>
      )}

      {dnsRecords.length > 0 && !dnsLoading && (
        <div style={s.card}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--accent)' }}>
            📋 查询结果 ({dnsRecords.length} 条记录)
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>名称</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>类型</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>TTL</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>值</th>
                </tr>
              </thead>
              <tbody>
                {dnsRecords.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontSize: 11 }}>{r.name}</td>
                    <td style={{ padding: '8px 12px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 6, background: 'var(--accent-bg)', color: 'var(--accent)', fontSize: 11, fontWeight: 600 }}>
                        {r.type}
                      </span>
                    </td>
                    <td style={{ padding: '8px 12px', color: 'var(--text-secondary)', fontSize: 11 }}>{r.TTL}s</td>
                    <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontSize: 11, wordBreak: 'break-all' }}>{r.data}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )

  const renderShortUrlPanel = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={s.card}>
        <label style={s.label}>🔗 短链接生成</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="app-input"
            style={s.input}
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="输入长链接，如 https://example.com/very/long/url"
            aria-label="长链接输入"
            onKeyDown={(e) => e.key === 'Enter' && generateShortUrl()}
          />
          <button className="app-button" style={s.btnPrimary} onClick={generateShortUrl} disabled={urlLoading} aria-label="生成短链">
            {urlLoading ? '生成中...' : '🔗 生成'}
          </button>
        </div>
      </div>

      {urlError && <div style={s.errorBox}>⚠️ {urlError}</div>}

      {urlLoading && (
        <div style={s.loadingBox}>
          <div style={{ fontSize: 32, animation: 'spin 1.2s linear infinite', marginBottom: 8 }}>🔗</div>
          <div>正在生成短链接...</div>
        </div>
      )}

      {shortUrl && !urlLoading && (
        <div style={{ ...s.card, background: 'linear-gradient(135deg, rgba(0,214,193,0.12), rgba(155,138,240,0.06))' }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--accent)' }}>
            ✅ 短链接已生成
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: 10,
              background: 'rgba(0,0,0,0.2)',
              fontFamily: 'monospace',
              fontSize: 14,
              fontWeight: 600,
              wordBreak: 'break-all',
            }}>
              {shortUrl}
            </div>
            <button className="app-button" style={s.btnSecondary} onClick={() => copyText(shortUrl, '短链接')}>
              📋 复制
            </button>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 8 }}>
            原始链接：{urlInput}
          </div>
        </div>
      )}
    </div>
  )

  const renderAvatarPanel = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={s.card}>
        <label style={s.label}>👤 随机用户头像生成</label>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
          获取随机用户信息，可用于测试数据或头像占位
        </p>
        <button className="app-button" style={s.btnPrimary} onClick={fetchRandomUser} disabled={avatarLoading} aria-label="获取随机头像">
          {avatarLoading ? '获取中...' : '👤 获取随机用户'}
        </button>
      </div>

      {avatarError && <div style={s.errorBox}>⚠️ {avatarError}</div>}

      {avatarLoading && (
        <div style={s.loadingBox}>
          <div style={{ fontSize: 32, animation: 'spin 1.2s linear infinite', marginBottom: 8 }}>👤</div>
          <div>正在获取随机用户...</div>
        </div>
      )}

      {avatarData && !avatarLoading && (
        <div style={{ ...s.card, background: 'linear-gradient(135deg, rgba(124,108,240,0.12), rgba(0,214,193,0.06))' }}>
          <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
            <img
              src={avatarData.picture.large}
              alt="随机头像"
              style={{ width: 96, height: 96, borderRadius: 14, border: '2px solid var(--accent)', objectFit: 'cover' }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
                {avatarData.name.title} {avatarData.name.first} {avatarData.name.last}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { label: '用户名', value: avatarData.login.username },
                  { label: '邮箱', value: avatarData.email },
                  { label: '电话', value: avatarData.phone },
                  { label: '城市', value: avatarData.location.city },
                  { label: '国家', value: avatarData.location.country },
                  { label: '国籍代码', value: avatarData.nat },
                ].map((item) => (
                  <div key={item.label} style={s.resultRow}>
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{item.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, wordBreak: 'break-all' }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  const renderExchangePanel = () => {
    const commonCurrencies = ['USD', 'CNY', 'EUR', 'GBP', 'JPY', 'KRW', 'HKD', 'TWD', 'SGD', 'AUD', 'CAD', 'CHF', 'THB', 'INR', 'RUB', 'BRL', 'MYR', 'PHP', 'VND', 'IDR']
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={s.card}>
          <label style={s.label}>💱 实时汇率查询</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              className="app-input"
              style={{ ...s.input, width: 80, flex: 'none' }}
              type="number"
              value={rateAmount}
              onChange={(e) => setRateAmount(e.target.value)}
              placeholder="金额"
              aria-label="金额"
            />
            <select
              value={rateFrom}
              onChange={(e) => setRateFrom(e.target.value)}
              aria-label="源货币"
              style={{
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid var(--glass-border)',
                background: 'rgba(0,0,0,0.2)',
                color: 'var(--text-primary)',
                fontSize: 13,
                outline: 'none',
              }}
            >
              {commonCurrencies.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <span style={{ color: 'var(--text-secondary)', fontSize: 16 }}>→</span>
            <select
              value={rateTo}
              onChange={(e) => setRateTo(e.target.value)}
              aria-label="目标货币"
              style={{
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid var(--glass-border)',
                background: 'rgba(0,0,0,0.2)',
                color: 'var(--text-primary)',
                fontSize: 13,
                outline: 'none',
              }}
            >
              {commonCurrencies.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <button className="app-button" style={s.btnPrimary} onClick={fetchExchangeRate} disabled={rateLoading} aria-label="查询汇率">
              {rateLoading ? '查询中...' : '💱 查询'}
            </button>
          </div>
        </div>

        {rateError && <div style={s.errorBox}>⚠️ {rateError}</div>}

        {rateLoading && (
          <div style={s.loadingBox}>
            <div style={{ fontSize: 32, animation: 'spin 1.2s linear infinite', marginBottom: 8 }}>💱</div>
            <div>正在查询汇率数据...</div>
          </div>
        )}

        {rateResult && !rateLoading && (
          <div style={{ ...s.card, background: 'linear-gradient(135deg, rgba(0,214,193,0.12), rgba(155,138,240,0.06))' }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--accent)' }}>
              ✅ 汇率查询结果
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>{rateResult}</div>
            {rateData && (
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                汇率：1 {rateFrom} = {rateData.rates[rateTo]?.toFixed(4)} {rateTo}
              </div>
            )}
          </div>
        )}

        {rateData && !rateLoading && (
          <div style={s.card}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--accent)' }}>
              📊 常用货币汇率（基准：{rateData.base}）
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 6 }}>
              {commonCurrencies.filter((c) => c !== rateFrom && rateData.rates[c]).map((c) => (
                <div key={c} style={s.resultRow}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{c}</span>
                  <span style={{ fontSize: 12, fontFamily: 'monospace' }}>{rateData.rates[c].toFixed(4)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderASCIIPanel = () => {
    const asciiResult = generateAsciiArt(asciiInput, asciiFont)
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={s.card}>
          <label style={s.label}>🎨 ASCII艺术文字生成</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input
              className="app-input"
              style={s.input}
              type="text"
              value={asciiInput}
              onChange={(e) => setAsciiInput(e.target.value)}
              placeholder="输入文字（支持A-Z, 0-9）"
              aria-label="ASCII艺术文字输入"
              maxLength={20}
            />
            <select
              value={asciiFont}
              onChange={(e) => setAsciiFont(e.target.value)}
              aria-label="字体选择"
              style={{
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid var(--glass-border)',
                background: 'rgba(0,0,0,0.2)',
                color: 'var(--text-primary)',
                fontSize: 13,
                outline: 'none',
              }}
            >
              <option value="block">方块字体</option>
              <option value="shadow">阴影字体</option>
            </select>
            <button className="app-button" style={s.btnSecondary} onClick={() => copyText(asciiResult, 'ASCII艺术')} aria-label="复制ASCII艺术">
              📋 复制
            </button>
          </div>
        </div>

        {asciiResult && (
          <div style={{ ...s.card, background: 'rgba(0,0,0,0.3)' }}>
            <pre style={{
              fontFamily: '"JetBrains Mono", "Fira Code", monospace',
              fontSize: 10,
              lineHeight: 1.2,
              color: 'var(--accent)',
              whiteSpace: 'pre',
              overflowX: 'auto',
              margin: 0,
            }}>
              {asciiResult}
            </pre>
          </div>
        )}
      </div>
    )
  }

  const renderPanel = () => {
    switch (activeTab) {
      case 'ip': return renderIPPanel()
      case 'dns': return renderDNSPanel()
      case 'shorturl': return renderShortUrlPanel()
      case 'avatar': return renderAvatarPanel()
      case 'exchange': return renderExchangePanel()
      case 'ascii': return renderASCIIPanel()
    }
  }

  return (
    <div style={s.container}>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* 标签页导航 */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          marginBottom: 16,
          padding: 4,
          borderRadius: 14,
          background: 'var(--glass-bg)',
          border: '1px solid var(--glass-border)',
          overflowX: 'auto',
        }}
        role="tablist"
        aria-label="工具箱标签页"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-label={tab.name}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: '1 1 auto',
              padding: '8px 12px',
              borderRadius: 10,
              border: 'none',
              background: activeTab === tab.id
                ? 'var(--accent-gradient, linear-gradient(135deg, #7c6cf0, #9b8af0))'
                : 'transparent',
              color: activeTab === tab.id ? '#fff' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: activeTab === tab.id ? 600 : 400,
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              minWidth: 0,
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.name}</span>
          </button>
        ))}
      </div>

      {/* 工具面板内容 */}
      <div role="tabpanel" aria-label={TABS.find((t) => t.id === activeTab)?.name}>
        {renderPanel()}
      </div>
    </div>
  )
}
