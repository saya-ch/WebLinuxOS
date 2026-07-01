import { useState, useCallback } from 'react'
import { useStore } from '../store'
import {
  Globe, DollarSign, Palette, Link, User, Search,
  Copy, RefreshCw
} from 'lucide-react'

type ToolTab = 'ip' | 'currency' | 'colors' | 'url' | 'avatar'

export default function UtilityToolkit() {
  const addNotification = useStore((s) => s.addNotification)
  const [activeTab, setActiveTab] = useState<ToolTab>('ip')

  const tabs: { id: ToolTab; label: string; icon: React.ReactNode }[] = [
    { id: 'ip', label: 'IP查询', icon: <Globe size={16} /> },
    { id: 'currency', label: '汇率转换', icon: <DollarSign size={16} /> },
    { id: 'colors', label: '调色板', icon: <Palette size={16} /> },
    { id: 'url', label: '短链接', icon: <Link size={16} /> },
    { id: 'avatar', label: '头像生成', icon: <User size={16} /> },
  ]

  const copyToClipboard = useCallback((text: string, message = '已复制到剪贴板') => {
    navigator.clipboard.writeText(text)
    addNotification({ title: '成功', message, type: 'success' })
  }, [addNotification])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--window-bg)', color: 'var(--text-primary)' }}>
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--window-border)',
        padding: '0 8px',
        background: 'rgba(255,255,255,0.02)',
      }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
              color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: activeTab === tab.id ? 600 : 400,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
        {activeTab === 'ip' && <IPLookupTool onCopy={copyToClipboard} />}
        {activeTab === 'currency' && <CurrencyConverterTool onCopy={copyToClipboard} />}
        {activeTab === 'colors' && <ColorPaletteTool onCopy={copyToClipboard} />}
        {activeTab === 'url' && <UrlShortenerTool onCopy={copyToClipboard} />}
        {activeTab === 'avatar' && <AvatarGeneratorTool onCopy={copyToClipboard} />}
      </div>
    </div>
  )
}

function IPLookupTool({ onCopy }: { onCopy: (text: string, msg?: string) => void }) {
  const addNotification = useStore((s) => s.addNotification)
  const [ip, setIp] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const lookupIP = useCallback(async () => {
    const targetIp = ip.trim()
    setLoading(true)
    setResult(null)
    try {
      const apiUrl = targetIp
        ? `https://ipapi.co/${targetIp}/json/`
        : 'https://ipapi.co/json/'
      const res = await fetch(apiUrl)
      const data = await res.json()
      if (data.error) {
        throw new Error(data.reason || '查询失败')
      }
      setResult(data)
    } catch (err: any) {
      addNotification({ title: '查询失败', message: err.message || '请检查IP地址格式', type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [ip, addNotification])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{
        background: 'rgba(139, 124, 240, 0.1)',
        border: '1px solid rgba(139, 124, 240, 0.3)',
        borderRadius: '12px',
        padding: '16px',
      }}>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-primary)' }}>
          <Globe size={16} style={{ display: 'inline', marginRight: '6px' }} />
          IP地址地理位置查询
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={ip}
            onChange={(e) => setIp(e.target.value)}
            placeholder="输入IP地址（留空查询本机IP）"
            style={{
              flex: 1,
              padding: '10px 14px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--window-border)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              fontSize: '13px',
              outline: 'none',
            }}
            onKeyDown={(e) => e.key === 'Enter' && lookupIP()}
          />
          <button
            onClick={lookupIP}
            disabled={loading}
            style={{
              padding: '10px 20px',
              background: 'var(--accent)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? <RefreshCw size={14} className="spin" /> : <Search size={14} />}
            查询
          </button>
        </div>
      </div>

      {result && (
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid var(--window-border)',
          borderRadius: '12px',
          padding: '20px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
          }}>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {result.ip}
            </div>
            <button
              onClick={() => onCopy(result.ip)}
              style={{
                padding: '6px 12px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--window-border)',
                borderRadius: '6px',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              <Copy size={12} style={{ display: 'inline', marginRight: '4px' }} />
              复制
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <InfoItem label="国家" value={`${result.country_name || '-'} ${result.country_emoji || ''}`} />
            <InfoItem label="地区" value={result.region || '-'} />
            <InfoItem label="城市" value={result.city || '-'} />
            <InfoItem label="邮编" value={result.postal || '-'} />
            <InfoItem label="经纬度" value={`${result.latitude?.toFixed(4)}, ${result.longitude?.toFixed(4)}`} />
            <InfoItem label="时区" value={result.timezone || '-'} />
            <InfoItem label="运营商" value={result.org || '-'} />
            <InfoItem label="ASN" value={result.asn || '-'} />
          </div>
        </div>
      )}
    </div>
  )
}

function CurrencyConverterTool({ onCopy }: { onCopy: (text: string, msg?: string) => void }) {
  const addNotification = useStore((s) => s.addNotification)
  const [amount, setAmount] = useState('1')
  const [fromCurrency, setFromCurrency] = useState('USD')
  const [toCurrency, setToCurrency] = useState('CNY')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ rate: number; converted: number; date: string } | null>(null)

  const currencies = [
    { code: 'USD', name: '美元', symbol: '$' },
    { code: 'CNY', name: '人民币', symbol: '¥' },
    { code: 'EUR', name: '欧元', symbol: '€' },
    { code: 'GBP', name: '英镑', symbol: '£' },
    { code: 'JPY', name: '日元', symbol: '¥' },
    { code: 'KRW', name: '韩元', symbol: '₩' },
    { code: 'HKD', name: '港币', symbol: 'HK$' },
    { code: 'SGD', name: '新加坡元', symbol: 'S$' },
    { code: 'AUD', name: '澳元', symbol: 'A$' },
    { code: 'CAD', name: '加元', symbol: 'C$' },
    { code: 'CHF', name: '瑞郎', symbol: 'CHF' },
    { code: 'INR', name: '印度卢比', symbol: '₹' },
  ]

  const convert = useCallback(async () => {
    if (!amount || isNaN(Number(amount))) {
      addNotification({ title: '请输入有效金额', message: '', type: 'warning' })
      return
    }
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch(`https://api.frankfurter.app/latest?from=${fromCurrency}&to=${toCurrency}`)
      const data = await res.json()
      const rate = data.rates[toCurrency]
      const converted = Number(amount) * rate
      setResult({ rate, converted, date: data.date })
    } catch (err: any) {
      addNotification({ title: '转换失败', message: '汇率服务暂时不可用', type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [amount, fromCurrency, toCurrency, addNotification])

  const swapCurrencies = () => {
    const temp = fromCurrency
    setFromCurrency(toCurrency)
    setToCurrency(temp)
    setResult(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{
        background: 'rgba(46, 204, 113, 0.1)',
        border: '1px solid rgba(46, 204, 113, 0.3)',
        borderRadius: '12px',
        padding: '20px',
      }}>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-primary)' }}>
          <DollarSign size={16} style={{ display: 'inline', marginRight: '6px' }} />
          实时汇率转换
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>金额</div>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--window-border)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '16px',
                fontWeight: 600,
                outline: 'none',
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ flex: 1 }}>
            <select
              value={fromCurrency}
              onChange={(e) => setFromCurrency(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--window-border)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '13px',
                outline: 'none',
              }}
            >
              {currencies.map((c) => (
                <option key={c.code} value={c.code}>{c.symbol} {c.name} ({c.code})</option>
              ))}
            </select>
          </div>

          <button
            onClick={swapCurrencies}
            style={{
              padding: '10px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--window-border)',
              borderRadius: '8px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
            title="交换货币"
          >
            ⇄
          </button>

          <div style={{ flex: 1 }}>
            <select
              value={toCurrency}
              onChange={(e) => setToCurrency(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--window-border)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '13px',
                outline: 'none',
              }}
            >
              {currencies.map((c) => (
                <option key={c.code} value={c.code}>{c.symbol} {c.name} ({c.code})</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={convert}
          disabled={loading}
          style={{
            width: '100%',
            marginTop: '16px',
            padding: '12px',
            background: 'var(--accent)',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 600,
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? '转换中...' : '转换'}
        </button>
      </div>

      {result && (
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid var(--window-border)',
          borderRadius: '12px',
          padding: '20px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            {amount} {fromCurrency} =
          </div>
          <div style={{
            fontSize: '32px',
            fontWeight: 700,
            color: '#2ecc71',
            marginBottom: '12px',
          }}>
            {result.converted.toLocaleString('zh-CN', { maximumFractionDigits: 4 })} {toCurrency}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            汇率: 1 {fromCurrency} = {result.rate.toFixed(4)} {toCurrency}
            <span style={{ marginLeft: '8px' }}>更新于 {result.date}</span>
          </div>
          <button
            onClick={() => onCopy(result.converted.toFixed(2), '已复制转换结果')}
            style={{
              marginTop: '12px',
              padding: '8px 16px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--window-border)',
              borderRadius: '6px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            <Copy size={12} style={{ display: 'inline', marginRight: '4px' }} />
            复制结果
          </button>
        </div>
      )}
    </div>
  )
}

function ColorPaletteTool({ onCopy }: { onCopy: (text: string, msg?: string) => void }) {
  const [baseColor, setBaseColor] = useState('#8b7cf0')
  const [palette, setPalette] = useState<string[]>([])

  const generatePalette = useCallback(() => {
    const hex = baseColor.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)

    const colors: string[] = []

    for (let i = 0; i < 5; i++) {
      const factor = (i + 1) / 6
      colors.push(`#${Math.round(r * factor).toString(16).padStart(2, '0')}${Math.round(g * factor).toString(16).padStart(2, '0')}${Math.round(b * factor).toString(16).padStart(2, '0')}`)
    }
    colors.push(baseColor)
    for (let i = 5; i > 0; i--) {
      const factor = (i + 1) / 6
      const nr = Math.round(r + (255 - r) * (1 - factor))
      const ng = Math.round(g + (255 - g) * (1 - factor))
      const nb = Math.round(b + (255 - b) * (1 - factor))
      colors.push(`#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`)
    }

    setPalette(colors)
  }, [baseColor])

  const generateRandom = useCallback(() => {
    const randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')
    setBaseColor(randomColor)
  }, [])

  const complementary = useCallback(() => {
    const hex = baseColor.replace('#', '')
    const r = 255 - parseInt(hex.substring(0, 2), 16)
    const g = 255 - parseInt(hex.substring(2, 4), 16)
    const b = 255 - parseInt(hex.substring(4, 6), 16)
    const comp = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
    setPalette([baseColor, comp])
  }, [baseColor])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{
        background: 'rgba(231, 76, 60, 0.1)',
        border: '1px solid rgba(231, 76, 60, 0.3)',
        borderRadius: '12px',
        padding: '20px',
      }}>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-primary)' }}>
          <Palette size={16} style={{ display: 'inline', marginRight: '6px' }} />
          调色板生成器
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <input
            type="color"
            value={baseColor}
            onChange={(e) => setBaseColor(e.target.value)}
            style={{
              width: '50px',
              height: '40px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          />
          <input
            type="text"
            value={baseColor}
            onChange={(e) => setBaseColor(e.target.value)}
            style={{
              flex: 1,
              padding: '10px 14px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--window-border)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              fontSize: '14px',
              fontFamily: 'monospace',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={generatePalette} style={paletteBtnStyle}>生成渐变色</button>
          <button onClick={complementary} style={paletteBtnStyle}>互补色</button>
          <button onClick={generateRandom} style={paletteBtnStyle}>随机颜色</button>
        </div>
      </div>

      {palette.length > 0 && (
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid var(--window-border)',
          borderRadius: '12px',
          padding: '20px',
        }}>
          <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-primary)' }}>
            调色板 ({palette.length} 种颜色)
          </div>
          <div style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
          }}>
            {palette.map((color, i) => (
              <div
                key={i}
                onClick={() => onCopy(color.toUpperCase(), `已复制 ${color.toUpperCase()}`)}
                style={{
                  width: '80px',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                }}
                className="hover-scale"
              >
                <div style={{
                  width: '100%',
                  height: '60px',
                  background: color,
                  borderRadius: '8px',
                  marginBottom: '6px',
                  border: '1px solid var(--window-border)',
                }} />
                <div style={{
                  fontSize: '11px',
                  textAlign: 'center',
                  color: 'var(--text-secondary)',
                  fontFamily: 'monospace',
                }}>
                  {color.toUpperCase()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const paletteBtnStyle: React.CSSProperties = {
  padding: '8px 16px',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid var(--window-border)',
  borderRadius: '8px',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
  fontSize: '12px',
}

function UrlShortenerTool({ onCopy }: { onCopy: (text: string, msg?: string) => void }) {
  const addNotification = useStore((s) => s.addNotification)
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [shortUrl, setShortUrl] = useState('')

  const shorten = useCallback(async () => {
    if (!url.trim() || !url.startsWith('http')) {
      addNotification({ title: '请输入有效URL', message: 'URL需以http://或https://开头', type: 'warning' })
      return
    }
    setLoading(true)
    setShortUrl('')
    try {
      const res = await fetch(`https://api.shrtco.de/v2/shorten?url=${encodeURIComponent(url)}`)
      const data = await res.json()
      if (data.ok) {
        setShortUrl(data.result.full_short_link)
      } else {
        throw new Error(data.error || '生成失败')
      }
    } catch (err: any) {
      addNotification({ title: '生成失败', message: err.message || '短链接服务暂时不可用', type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [url, addNotification])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{
        background: 'rgba(52, 152, 219, 0.1)',
        border: '1px solid rgba(52, 152, 219, 0.3)',
        borderRadius: '12px',
        padding: '20px',
      }}>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-primary)' }}>
          <Link size={16} style={{ display: 'inline', marginRight: '6px' }} />
          URL短链接生成
        </div>

        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="输入长链接 (https://...)"
          style={{
            width: '100%',
            padding: '10px 14px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid var(--window-border)',
            borderRadius: '8px',
            color: 'var(--text-primary)',
            fontSize: '13px',
            outline: 'none',
            marginBottom: '12px',
            boxSizing: 'border-box',
          }}
          onKeyDown={(e) => e.key === 'Enter' && shorten()}
        />

        <button
          onClick={shorten}
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            background: 'var(--accent)',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 600,
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? '生成中...' : '生成短链接'}
        </button>
      </div>

      {shortUrl && (
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid var(--window-border)',
          borderRadius: '12px',
          padding: '20px',
        }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>短链接</div>
          <div style={{
            fontSize: '16px',
            fontWeight: 600,
            color: 'var(--accent)',
            wordBreak: 'break-all',
            marginBottom: '12px',
          }}>
            {shortUrl}
          </div>
          <button
            onClick={() => onCopy(shortUrl, '短链接已复制')}
            style={{
              padding: '8px 16px',
              background: 'rgba(139, 124, 240, 0.2)',
              border: '1px solid rgba(139, 124, 240, 0.3)',
              borderRadius: '6px',
              color: 'var(--accent)',
              cursor: 'pointer',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Copy size={14} />
            复制链接
          </button>
        </div>
      )}
    </div>
  )
}

function AvatarGeneratorTool({ onCopy }: { onCopy: (text: string, msg?: string) => void }) {
  const [seed, setSeed] = useState('')
  const [style, setStyle] = useState<'adventurer' | 'avataaars' | 'bottts' | 'fun-emoji' | 'lorelei' | 'pixel-art'>('adventurer')
  const [size, setSize] = useState(200)

  const styles: { id: string; label: string }[] = [
    { id: 'adventurer', label: '冒险家' },
    { id: 'avataaars', label: '卡通' },
    { id: 'bottts', label: '机器人' },
    { id: 'fun-emoji', label: '表情' },
    { id: 'lorelei', label: '萝莉' },
    { id: 'pixel-art', label: '像素风' },
  ]

  const generateRandom = () => {
    setSeed(Math.random().toString(36).substring(2, 10))
  }

  const avatarUrl = `https://api.dicebear.com/7.x/${style}/svg?seed=${seed || 'default'}&size=${size}`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{
        background: 'rgba(155, 89, 182, 0.1)',
        border: '1px solid rgba(155, 89, 182, 0.3)',
        borderRadius: '12px',
        padding: '20px',
      }}>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-primary)' }}>
          <User size={16} style={{ display: 'inline', marginRight: '6px' }} />
          头像生成器 (DiceBear API)
        </div>

        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>种子 (Seed)</div>
          <input
            type="text"
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            placeholder="输入种子字符串生成独特头像"
            style={{
              width: '100%',
              padding: '10px 14px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--window-border)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              fontSize: '13px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>风格</div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {styles.map((s) => (
              <button
                key={s.id}
                onClick={() => setStyle(s.id as any)}
                style={{
                  padding: '6px 12px',
                  background: style === s.id ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--window-border)',
                  borderRadius: '6px',
                  color: style === s.id ? '#fff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>尺寸: {size}px</div>
          <input
            type="range"
            min="64"
            max="512"
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        <button
          onClick={generateRandom}
          style={{
            width: '100%',
            padding: '12px',
            background: 'var(--accent)',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          <RefreshCw size={14} />
          随机生成
        </button>
      </div>

      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid var(--window-border)',
        borderRadius: '12px',
        padding: '20px',
        textAlign: 'center',
      }}>
        <div style={{
          display: 'inline-block',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '16px',
          padding: '16px',
          marginBottom: '12px',
        }}>
          <img
            src={avatarUrl}
            alt="Avatar preview"
            style={{ width: size > 200 ? 200 : size, height: size > 200 ? 200 : size, borderRadius: '8px' }}
          />
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '10px', wordBreak: 'break-all' }}>
          {avatarUrl}
        </div>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          <button
            onClick={() => onCopy(avatarUrl, '头像链接已复制')}
            style={{
              padding: '8px 16px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--window-border)',
              borderRadius: '6px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            <Copy size={12} style={{ display: 'inline', marginRight: '4px' }} />
            复制链接
          </button>
          <a
            href={avatarUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '8px 16px',
              background: 'rgba(155, 89, 182, 0.2)',
              border: '1px solid rgba(155, 89, 182, 0.3)',
              borderRadius: '6px',
              color: '#9b59b6',
              cursor: 'pointer',
              fontSize: '12px',
              textDecoration: 'none',
            }}
          >
            查看大图
          </a>
        </div>
      </div>
    </div>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      padding: '10px 12px',
      background: 'rgba(255,255,255,0.03)',
      borderRadius: '8px',
    }}>
      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}>{value}</div>
    </div>
  )
}
