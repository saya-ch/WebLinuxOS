import { useState, useEffect, useCallback, useMemo, memo } from 'react'

interface CurrencyInfo {
  code: string
  name: string
  symbol: string
  flag: string
}

const CURRENCIES: CurrencyInfo[] = [
  { code: 'USD', name: '美元', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', name: '欧元', symbol: '€', flag: '🇪🇺' },
  { code: 'GBP', name: '英镑', symbol: '£', flag: '🇬🇧' },
  { code: 'JPY', name: '日元', symbol: '¥', flag: '🇯🇵' },
  { code: 'CNY', name: '人民币', symbol: '¥', flag: '🇨🇳' },
  { code: 'HKD', name: '港币', symbol: 'HK$', flag: '🇭🇰' },
  { code: 'SGD', name: '新加坡元', symbol: 'S$', flag: '🇸🇬' },
  { code: 'AUD', name: '澳元', symbol: 'A$', flag: '🇦🇺' },
  { code: 'NZD', name: '新西兰元', symbol: 'NZ$', flag: '🇳🇿' },
  { code: 'CAD', name: '加元', symbol: 'C$', flag: '🇨🇦' },
  { code: 'CHF', name: '瑞士法郎', symbol: 'CHF', flag: '🇨🇭' },
  { code: 'KRW', name: '韩元', symbol: '₩', flag: '🇰🇷' },
  { code: 'INR', name: '印度卢比', symbol: '₹', flag: '🇮🇳' },
  { code: 'THB', name: '泰铢', symbol: '฿', flag: '🇹🇭' },
  { code: 'TWD', name: '新台币', symbol: 'NT$', flag: '🇹🇼' },
  { code: 'MYR', name: '马来西亚林吉特', symbol: 'RM', flag: '🇲🇾' },
  { code: 'IDR', name: '印尼盾', symbol: 'Rp', flag: '🇮🇩' },
  { code: 'VND', name: '越南盾', symbol: '₫', flag: '🇻🇳' },
  { code: 'PHP', name: '菲律宾比索', symbol: '₱', flag: '🇵🇭' },
  { code: 'SEK', name: '瑞典克朗', symbol: 'kr', flag: '🇸🇪' },
  { code: 'NOK', name: '挪威克朗', symbol: 'kr', flag: '🇳🇴' },
  { code: 'DKK', name: '丹麦克朗', symbol: 'kr', flag: '🇩🇰' },
  { code: 'RUB', name: '俄罗斯卢布', symbol: '₽', flag: '🇷🇺' },
  { code: 'TRY', name: '土耳其里拉', symbol: '₺', flag: '🇹🇷' },
  { code: 'ZAR', name: '南非兰特', symbol: 'R', flag: '🇿🇦' },
  { code: 'BRL', name: '巴西雷亚尔', symbol: 'R$', flag: '🇧🇷' },
  { code: 'MXN', name: '墨西哥比索', symbol: 'Mex$', flag: '🇲🇽' },
  { code: 'PLN', name: '波兰兹罗提', symbol: 'zł', flag: '🇵🇱' },
  { code: 'CZK', name: '捷克克朗', symbol: 'Kč', flag: '🇨🇿' },
  { code: 'HUF', name: '匈牙利福林', symbol: 'Ft', flag: '🇭🇺' },
  { code: 'ILS', name: '以色列新谢克尔', symbol: '₪', flag: '🇮🇱' },
  { code: 'AED', name: '阿联酋迪拉姆', symbol: 'د.إ', flag: '🇦🇪' },
  { code: 'SAR', name: '沙特里亚尔', symbol: 'ر.س', flag: '🇸🇦' },
  { code: 'NPR', name: '尼泊尔卢比', symbol: 'रू', flag: '🇳🇵' },
  { code: 'PKR', name: '巴基斯坦卢比', symbol: 'Rs', flag: '🇵🇰' },
  { code: 'BDT', name: '孟加拉塔卡', symbol: '৳', flag: '🇧🇩' },
  { code: 'EGP', name: '埃及镑', symbol: '£E', flag: '🇪🇬' },
]

function getCurrencyInfo(code: string): CurrencyInfo {
  return CURRENCIES.find((c) => c.code === code) || { code, name: code, symbol: code, flag: '🏳️' }
}

function formatNumber(value: number, digits = 4): string {
  if (!isFinite(value)) return '—'
  if (value === 0) return '0'
  const abs = Math.abs(value)
  if (abs >= 10000) return value.toLocaleString('en-US', { maximumFractionDigits: 2 })
  if (abs >= 1) return value.toLocaleString('en-US', { maximumFractionDigits: digits })
  return value.toLocaleString('en-US', { maximumSignificantDigits: 6 })
}

interface RateCache {
  [key: string]: { rate: number; fetched: number }
}

const CurrencyLive = memo(function CurrencyLive() {
  const [tab, setTab] = useState<'convert' | 'table' | 'history'>('convert')
  const [amount, setAmount] = useState<string>('100')
  const [from, setFrom] = useState<string>('USD')
  const [to, setTo] = useState<string>('CNY')
  const [rate, setRate] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [rateCache, setRateCache] = useState<RateCache>({})
  const [historyData, setHistoryData] = useState<{ dates: string[]; values: number[] } | null>(null)
  const [historyFrom, setHistoryFrom] = useState<string>('USD')
  const [historyTo, setHistoryTo] = useState<string>('CNY')
  const [historyDays, setHistoryDays] = useState<number>(90)
  const [historyLoading, setHistoryLoading] = useState(false)

  const fetchRate = useCallback(async (fromCode: string, toCode: string) => {
    if (fromCode === toCode) {
      setRate(1)
      return
    }
    const key = `${fromCode}_${toCode}`
    const cached = rateCache[key]
    if (cached && Date.now() - cached.fetched < 5 * 60 * 1000) {
      setRate(cached.rate)
      setLastUpdated(new Date(cached.fetched))
      return
    }
    setLoading(true)
    setError(null)
    try {
      const url = `https://api.frankfurter.app/latest?from=${fromCode}&to=${toCode}`
      const res = await fetch(url, { cache: 'force-cache' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const r = data.rates?.[toCode] as number | undefined
      if (typeof r !== 'number') throw new Error('无效数据')
      setRate(r)
      setRateCache((prev) => ({ ...prev, [key]: { rate: r, fetched: Date.now() } }))
      setLastUpdated(new Date())
    } catch (e) {
      console.error('Rate fetch error:', e)
      setError('无法获取汇率（该货币对可能不受支持）')
    } finally {
      setLoading(false)
    }
  }, [rateCache])

  useEffect(() => {
    fetchRate(from, to)
  }, [from, to, fetchRate])

  // 历史汇率获取
  const fetchHistory = useCallback(async (fromCode: string, toCode: string, days: number) => {
    if (fromCode === toCode) {
      setHistoryData({ dates: [], values: [] })
      return
    }
    setHistoryLoading(true)
    try {
      const end = new Date()
      const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000)
      const fmt = (d: Date) => d.toISOString().slice(0, 10)
      const url = `https://api.frankfurter.app/${fmt(start)}..${fmt(end)}?from=${fromCode}&to=${toCode}`
      const res = await fetch(url, { cache: 'force-cache' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const entries = Object.entries(data.rates || {}).sort((a, b) => (a[0] < b[0] ? -1 : 1))
      const dates = entries.map(([d]) => d)
      const values = entries.map(([, v]) => (v as Record<string, number>)[toCode])
      setHistoryData({ dates, values })
    } catch (e) {
      console.error('History fetch error:', e)
      setHistoryData(null)
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  useEffect(() => {
    if (tab === 'history') {
      fetchHistory(historyFrom, historyTo, historyDays)
    }
  }, [tab, historyFrom, historyTo, historyDays, fetchHistory])

  const converted = useMemo(() => {
    const a = parseFloat(amount.replace(/[, ]/g, ''))
    if (!rate || isNaN(a)) return null
    return a * rate
  }, [amount, rate])

  // 简易 SVG 图表
  const historyChart = useMemo(() => {
    if (!historyData || historyData.values.length === 0) return null
    const values = historyData.values
    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = max - min || 1
    const width = 720
    const height = 260
    const pad = 40
    const chartW = width - pad * 2
    const chartH = height - pad * 2
    const pts = values.map((v, i) => {
      const x = pad + (i / (values.length - 1 || 1)) * chartW
      const y = pad + chartH - ((v - min) / range) * chartH
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    const path = `M ${pts.join(' L ')}`
    const areaPath = `${path} L ${pad + chartW},${pad + chartH} L ${pad},${pad + chartH} Z`
    // 坐标轴刻度
    const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
      y: pad + chartH - t * chartH,
      v: (min + t * range).toFixed(4),
    }))
    return (
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12 }}>
        <defs>
          <linearGradient id="currgrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={pad} y1={t.y} x2={pad + chartW} y2={t.y} stroke="rgba(255,255,255,0.08)" />
            <text x={pad - 8} y={t.y + 4} fill="rgba(255,255,255,0.5)" fontSize="10" textAnchor="end">{t.v}</text>
          </g>
        ))}
        <path d={areaPath} fill="url(#currgrad)" />
        <path d={path} stroke="#10b981" strokeWidth="2" fill="none" />
        {historyData.dates.length > 0 && (
          <>
            <text x={pad} y={height - 10} fill="rgba(255,255,255,0.5)" fontSize="10">{historyData.dates[0]}</text>
            <text x={pad + chartW} y={height - 10} fill="rgba(255,255,255,0.5)" fontSize="10" textAnchor="end">
              {historyData.dates[historyData.dates.length - 1]}
            </text>
          </>
        )}
      </svg>
    )
  }, [historyData])

  const historyStats = useMemo(() => {
    if (!historyData || historyData.values.length === 0) return null
    const v = historyData.values
    const min = Math.min(...v)
    const max = Math.max(...v)
    const avg = v.reduce((a, b) => a + b, 0) / v.length
    const first = v[0]
    const last = v[v.length - 1]
    const change = ((last - first) / first) * 100
    return { min, max, avg, change, current: last }
  }, [historyData])

  return (
    <div style={{
      height: '100%',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 60%, #065f46 100%)',
      color: '#fff',
      overflow: 'auto',
      boxSizing: 'border-box',
    }}>
      <div style={{ padding: 24 }}>
        <div style={{
          display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 12,
        }}>
          {([
            ['convert', '💱 货币转换'],
            ['table', '📊 汇率表'],
            ['history', '📈 历史走势'],
          ] as const).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              style={{
                padding: '10px 16px',
                border: 'none',
                borderRadius: 10,
                background: tab === k ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.05)',
                color: tab === k ? '#6ee7b7' : '#fff',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
                transition: 'background 0.2s',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'convert' && (
          <>
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              borderRadius: 16,
              padding: 24,
              marginBottom: 20,
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6 }}>金额</label>
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^0-9.,]/g, ''))}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '14px 18px',
                    fontSize: 24,
                    fontWeight: 600,
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 10,
                    color: '#fff',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6 }}>从</label>
                  <select
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 10px',
                      background: 'rgba(0,0,0,0.3)',
                      color: '#fff',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: 10,
                      fontSize: 14,
                      outline: 'none',
                    }}
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code} style={{ background: '#1e293b', color: '#fff' }}>
                        {c.flag} {c.code} — {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => { setFrom(to); setTo(from) }}
                  style={{
                    background: 'rgba(16,185,129,0.15)',
                    border: 'none',
                    borderRadius: 999,
                    width: 44,
                    height: 44,
                    fontSize: 18,
                    color: '#6ee7b7',
                    cursor: 'pointer',
                    marginTop: 18,
                  }}
                  title="交换"
                >
                  ⇌
                </button>
                <div>
                  <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6 }}>到</label>
                  <select
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 10px',
                      background: 'rgba(0,0,0,0.3)',
                      color: '#fff',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: 10,
                      fontSize: 14,
                      outline: 'none',
                    }}
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code} style={{ background: '#1e293b', color: '#fff' }}>
                        {c.flag} {c.code} — {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {loading && !rate && (
                <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>
                  获取汇率中...
                </div>
              )}

              {error && !loading && (
                <div style={{ background: 'rgba(239,68,68,0.15)', padding: 16, borderRadius: 10, fontSize: 13, color: '#fca5a5', textAlign: 'center' }}>
                  {error}
                </div>
              )}

              {rate !== null && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>
                    {getCurrencyInfo(from).flag} {from} → {getCurrencyInfo(to).flag} {to}
                  </div>
                  <div style={{ fontSize: 48, fontWeight: 200, marginBottom: 8, color: '#fff' }}>
                    {converted !== null ? formatNumber(converted, 4) : '—'}
                  </div>
                  <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 14 }}>
                    1 {from} = {formatNumber(rate, 6)} {to}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 16 }}>
                    {lastUpdated ? `最后更新: ${lastUpdated.toLocaleTimeString()}` : ''} · 数据来源: Frankfurter API (欧洲央行)
                  </div>
                </div>
              )}
            </div>

            <div style={{
              background: 'rgba(255,255,255,0.04)',
              borderRadius: 14,
              padding: 20,
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: '#fff' }}>💡 快捷转换（常用）</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
                {[
                  ['USD', 'CNY'], ['EUR', 'CNY'], ['JPY', 'CNY'], ['HKD', 'CNY'],
                  ['USD', 'EUR'], ['GBP', 'USD'], ['USD', 'JPY'], ['CNY', 'USD'],
                  ['EUR', 'USD'], ['USD', 'SGD'], ['USD', 'KRW'], ['USD', 'INR'],
                ].map(([f, t2]) => (
                  <button
                    key={`${f}-${t2}`}
                    onClick={() => { setFrom(f); setTo(t2) }}
                    style={{
                      padding: '10px 8px',
                      background: from === f && to === t2 ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: '#fff',
                      borderRadius: 8,
                      fontSize: 12,
                      cursor: 'pointer',
                      fontWeight: 500,
                      transition: 'background 0.2s',
                    }}
                  >
                    {getCurrencyInfo(f).flag} {f} → {getCurrencyInfo(t2).flag} {t2}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {tab === 'table' && (
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            borderRadius: 16,
            padding: 20,
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>基准货币:</label>
              <select
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                style={{
                  padding: '8px 12px',
                  background: 'rgba(0,0,0,0.3)',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 8,
                  fontSize: 13,
                  outline: 'none',
                }}
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code} style={{ background: '#1e293b', color: '#fff' }}>
                    {c.flag} {c.code}
                  </option>
                ))}
              </select>
            </div>
            <CurrencyTable base={from} cache={rateCache} setCache={setRateCache} />
          </div>
        )}

        {tab === 'history' && (
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            borderRadius: 16,
            padding: 20,
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10, marginBottom: 16, alignItems: 'end' }}>
              <div>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 4 }}>来源</label>
                <select
                  value={historyFrom}
                  onChange={(e) => setHistoryFrom(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    background: 'rgba(0,0,0,0.3)',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 8,
                    fontSize: 13,
                    outline: 'none',
                  }}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code} style={{ background: '#1e293b', color: '#fff' }}>
                      {c.flag} {c.code}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 4 }}>目标</label>
                <select
                  value={historyTo}
                  onChange={(e) => setHistoryTo(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    background: 'rgba(0,0,0,0.3)',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 8,
                    fontSize: 13,
                    outline: 'none',
                  }}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code} style={{ background: '#1e293b', color: '#fff' }}>
                      {c.flag} {c.code}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 4 }}>区间</label>
                <select
                  value={historyDays}
                  onChange={(e) => setHistoryDays(parseInt(e.target.value, 10))}
                  style={{
                    padding: '8px 12px',
                    background: 'rgba(0,0,0,0.3)',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 8,
                    fontSize: 13,
                    outline: 'none',
                  }}
                >
                  <option value={30} style={{ background: '#1e293b', color: '#fff' }}>30天</option>
                  <option value={90} style={{ background: '#1e293b', color: '#fff' }}>90天</option>
                  <option value={180} style={{ background: '#1e293b', color: '#fff' }}>180天</option>
                  <option value={365} style={{ background: '#1e293b', color: '#fff' }}>1年</option>
                </select>
              </div>
            </div>

            {historyLoading && (
              <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>加载历史数据中...</div>
            )}

            {!historyLoading && historyChart && historyStats && (
              <>
                <div style={{ marginBottom: 16 }}>{historyChart}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                  {[
                    { label: '当前', value: historyStats.current.toFixed(4), color: '#6ee7b7' },
                    { label: `期内最高`, value: historyStats.max.toFixed(4), color: '#fca5a5' },
                    { label: `期内最低`, value: historyStats.min.toFixed(4), color: '#93c5fd' },
                    { label: `期内变化`, value: `${historyStats.change >= 0 ? '+' : ''}${historyStats.change.toFixed(2)}%`, color: historyStats.change >= 0 ? '#34d399' : '#f87171' },
                  ].map((s) => (
                    <div key={s.label} style={{
                      background: 'rgba(255,255,255,0.04)',
                      borderRadius: 10,
                      padding: 14,
                      textAlign: 'center',
                    }}>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>{s.label}</div>
                      <div style={{ fontSize: 16, fontWeight: 600, color: s.color }}>{s.value}</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {!historyLoading && !historyData && (
              <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
                无法获取历史数据（该货币对可能不受支持）
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
})

// 汇率表
function CurrencyTable({ base, setCache }: { base: string; cache: RateCache; setCache: React.Dispatch<React.SetStateAction<RateCache>> }) {
  const [rates, setRates] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    const targets = CURRENCIES.filter((c) => c.code !== base).map((c) => c.code).join(',')
    const url = `https://api.frankfurter.app/latest?from=${base}&to=${targets}`
    fetch(url, { cache: 'force-cache' })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((data) => {
        if (cancelled) return
        const r: Record<string, number> = data.rates || {}
        setRates(r)
        setCache((prev) => {
          const next = { ...prev }
          Object.entries(r).forEach(([k, v]) => {
            next[`${base}_${k}`] = { rate: v as number, fetched: Date.now() }
          })
          return next
        })
      })
      .catch((e) => {
        if (cancelled) return
        console.error('Table fetch error:', e)
        setError('无法获取汇率表')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [base, setCache])

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>加载中...</div>
  }
  if (error) {
    return <div style={{ padding: 20, color: '#fca5a5', fontSize: 13, textAlign: 'center' }}>{error}</div>
  }

  const entries = CURRENCIES
    .filter((c) => c.code !== base)
    .map((c) => ({ code: c.code, rate: rates[c.code], info: c }))
    .sort((a, b) => {
      if (a.rate === undefined && b.rate === undefined) return 0
      if (a.rate === undefined) return 1
      if (b.rate === undefined) return -1
      return 0
    })

  return (
    <div style={{ maxHeight: 500, overflow: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: 'rgba(255,255,255,0.06)' }}>
            <th style={{ textAlign: 'left', padding: '12px 14px', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>货币</th>
            <th style={{ textAlign: 'right', padding: '12px 14px', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>1 {base} =</th>
            <th style={{ textAlign: 'right', padding: '12px 14px', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>1 单位 = {base}</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={e.code} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <td style={{ padding: '10px 14px', color: '#fff' }}>
                <span style={{ fontSize: 16, marginRight: 8 }}>{e.info.flag}</span>
                <span style={{ fontWeight: 600, marginRight: 8 }}>{e.code}</span>
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{e.info.name}</span>
              </td>
              <td style={{ padding: '10px 14px', textAlign: 'right', color: e.rate !== undefined ? '#6ee7b7' : 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>
                {e.rate !== undefined ? formatNumber(e.rate, 6) : '—'}
              </td>
              <td style={{ padding: '10px 14px', textAlign: 'right', color: e.rate !== undefined && e.rate > 0 ? '#93c5fd' : 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>
                {e.rate !== undefined && e.rate > 0 ? formatNumber(1 / e.rate, 6) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default CurrencyLive
