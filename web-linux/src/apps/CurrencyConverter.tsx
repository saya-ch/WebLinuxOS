import { useState, useEffect, useCallback, useMemo } from 'react'
import { useStore } from '../store'

// ==================== 类型定义 ====================
interface Currency {
  code: string
  name: string
  symbol?: string
}

interface RateHistory {
  date: string
  rate: number
}

// ==================== 常量：常用货币 ====================
const POPULAR: Currency[] = [
  { code: 'CNY', name: '人民币', symbol: '¥' },
  { code: 'USD', name: '美元', symbol: '$' },
  { code: 'EUR', name: '欧元', symbol: '€' },
  { code: 'JPY', name: '日元', symbol: '¥' },
  { code: 'GBP', name: '英镑', symbol: '£' },
  { code: 'HKD', name: '港币', symbol: 'HK$' },
  { code: 'KRW', name: '韩元', symbol: '₩' },
  { code: 'AUD', name: '澳元', symbol: 'A$' },
  { code: 'CAD', name: '加元', symbol: 'C$' },
  { code: 'CHF', name: '瑞郎', symbol: 'Fr' },
  { code: 'SGD', name: '新加坡元', symbol: 'S$' },
  { code: 'NZD', name: '新西兰元', symbol: 'NZ$' },
  { code: 'INR', name: '印度卢比', symbol: '₹' },
  { code: 'THB', name: '泰铢', symbol: '฿' },
  { code: 'SEK', name: '瑞典克朗', symbol: 'kr' },
  { code: 'NOK', name: '挪威克朗', symbol: 'kr' },
  { code: 'DKK', name: '丹麦克朗', symbol: 'kr' },
  { code: 'PLN', name: '波兰兹罗提', symbol: 'zł' },
]

// 快速金额按钮
const QUICK_AMOUNTS = [1, 10, 100, 1000, 10000]

// ==================== SVG Sparkline 历史汇率 ====================
function RateSparkline({ data, color = '#7c6cf0', label = '' }: { data: RateHistory[]; color?: string; label?: string }) {
  const width = 500
  const height = 140
  const padding = 24
  if (data.length === 0) return null

  const values = data.map((d) => d.rate)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  const stepX = (width - padding * 2) / Math.max(1, values.length - 1)

  // 构建 SVG path
  let pathD = ''
  values.forEach((v, i) => {
    const x = padding + i * stepX
    const y = height - padding - ((v - min) / range) * (height - padding * 2)
    pathD += `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)} `
  })

  // 填充区域 path
  const areaD =
    pathD +
    `L ${padding + (values.length - 1) * stepX} ${height - padding} ` +
    `L ${padding} ${height - padding} Z`

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
      {/* 背景网格 */}
      {[0, 1, 2, 3, 4].map((i) => (
        <line
          key={i}
          x1={padding}
          x2={width - padding}
          y1={padding + ((height - padding * 2) / 4) * i}
          y2={padding + ((height - padding * 2) / 4) * i}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="1"
        />
      ))}
      {/* 渐变填充 */}
      <defs>
        <linearGradient id="currency-gradient" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#currency-gradient)" />
      {/* 折线 */}
      <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* 首尾点 */}
      {[0, values.length - 1].map((i) => {
        const x = padding + i * stepX
        const y = height - padding - ((values[i] - min) / range) * (height - padding * 2)
        return <circle key={`pt-${i}`} cx={x} cy={y} r="4" fill={color} />
      })}
      {/* 起止标注 */}
      <text x={padding} y={height - 4} fill="rgba(255,255,255,0.45)" fontSize="10">
        {data[0]?.date}
      </text>
      <text x={width - padding} y={height - 4} fill="rgba(255,255,255,0.45)" fontSize="10" textAnchor="end">
        {data[data.length - 1]?.date}
      </text>
      <text x={padding} y={padding - 8} fill={color} fontSize="11" fontWeight="600">
        {label} 最低 {min.toFixed(4)} · 最高 {max.toFixed(4)}
      </text>
    </svg>
  )
}

// ==================== 主组件 ====================
export default function CurrencyConverter() {
  const [currencies, setCurrencies] = useState<Currency[]>(POPULAR)
  const [fromCurrency, setFromCurrency] = useState<string>('CNY')
  const [toCurrency, setToCurrency] = useState<string>('USD')
  const [amount, setAmount] = useState<string>('100')
  const [rate, setRate] = useState<number | null>(null)
  const [rateHistory, setRateHistory] = useState<RateHistory[]>([])
  const [historyLoading, setHistoryLoading] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const addNotification = useStore((s) => s.addNotification)

  // ========== 获取当前汇率（frankfurter.app） ==========
  const fetchRate = useCallback(async (from: string, to: string) => {
    setLoading(true)
    setError(null)
    try {
      const url = `https://api.frankfurter.app/latest?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const rateValue: number | undefined = data.rates?.[to]
      if (typeof rateValue !== 'number') throw new Error('返回数据格式异常')
      setRate(rateValue)
      setLastUpdated(new Date())
    } catch (err) {
      const msg = err instanceof Error ? err.message : '请求失败'
      setError(`汇率获取失败：${msg}`)
      setRate(null)
      addNotification({ title: '汇率转换', message: '汇率获取失败', type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [addNotification])

  // ========== 获取近 30 天历史汇率 ==========
  const fetchHistory = useCallback(async (from: string, to: string) => {
    if (from === to) {
      // 相同货币，历史恒为 1
      const now = new Date()
      const history: RateHistory[] = Array.from({ length: 30 }).map((_, i) => {
        const d = new Date(now)
        d.setDate(now.getDate() - (29 - i))
        return { date: `${d.getMonth() + 1}/${d.getDate()}`, rate: 1 }
      })
      setRateHistory(history)
      return
    }
    setHistoryLoading(true)
    try {
      const now = new Date()
      const start = new Date(now)
      start.setDate(now.getDate() - 30)

      const fmt = (d: Date) => d.toISOString().slice(0, 10)
      const url = `https://api.frankfurter.app/${fmt(start)}..${fmt(now)}?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const rawRates: Record<string, number> = data.rates ?? {}
      const history: RateHistory[] = Object.keys(rawRates)
        .sort()
        .map((date) => {
          const d = new Date(date)
          return {
            date: `${d.getMonth() + 1}/${d.getDate()}`,
            rate: rawRates[date],
          }
        })
      setRateHistory(history)
    } catch {
      // 历史获取失败时静默忽略，但在界面上通过 loading 状态展示
      setRateHistory([])
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  // ========== 获取完整货币列表（首次加载） ==========
  useEffect(() => {
    let cancelled = false
    async function loadAll() {
      try {
        const res = await fetch('https://api.frankfurter.app/currencies')
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data: Record<string, string> = await res.json()
        if (!cancelled) {
          const apiList: Currency[] = Object.keys(data).map((code) => ({ code, name: data[code] }))
          // 把 POPULAR 中的货币按优先级排列，然后追加 API 中新增的
          const order = new Set(POPULAR.map((c) => c.code))
          const merged: Currency[] = [
            ...POPULAR.map((c) => {
              const apiName = data[c.code]
              return apiName ? { ...c, name: apiName } : c
            }),
            ...apiList.filter((c) => !order.has(c.code)),
          ]
          setCurrencies(merged)
        }
      } catch {
        // 失败时使用内置 POPULAR
      }
    }
    loadAll()
    return () => {
      cancelled = true
    }
  }, [])

  // 当 from/to 改变时重新请求
  useEffect(() => {
    fetchRate(fromCurrency, toCurrency)
    fetchHistory(fromCurrency, toCurrency)
  }, [fromCurrency, toCurrency, fetchRate, fetchHistory])

  // 交换 from/to
  const swap = useCallback(() => {
    setFromCurrency(toCurrency)
    setToCurrency(fromCurrency)
  }, [fromCurrency, toCurrency])

  // 快速金额
  const setQuickAmount = useCallback((v: number) => setAmount(String(v)), [])

  // 计算结果
  const result = useMemo(() => {
    const n = parseFloat(amount)
    if (!isFinite(n) || rate === null) return null
    return n * rate
  }, [amount, rate])

  // 反向计算（从 to 金额反推 from 金额）
  const [toAmount, setToAmount] = useState<string>('')
  useEffect(() => {
    if (result !== null) setToAmount(result.toFixed(2))
  }, [result])

  // 双向转换：如果用户修改 toAmount，则反推 amount
  const onToAmountChange = (v: string) => {
    setToAmount(v)
    const n = parseFloat(v)
    if (isFinite(n) && rate && rate > 0) {
      setAmount((n / rate).toFixed(2))
    }
  }

  const fromCurrencyInfo = currencies.find((c) => c.code === fromCurrency)
  const toCurrencyInfo = currencies.find((c) => c.code === toCurrency)

  return (
    <div className="app-shell" style={{ height: '100%', overflowY: 'auto', padding: 16, background: 'linear-gradient(135deg, #14142b 0%, #1e1e3f 100%)', color: '#fff' }}>
      {/* 标题 */}
      <div className="app-card" style={{ padding: 16, marginBottom: 16, borderRadius: 12, background: 'linear-gradient(135deg, rgba(124, 108, 240, 0.2), rgba(90, 200, 250, 0.1))', border: '1px solid rgba(124, 108, 240, 0.3)', textAlign: 'center' }}>
        <div style={{ fontSize: 28, marginBottom: 4 }}>💱</div>
        <div style={{ fontSize: 18, fontWeight: 600 }}>实时汇率转换</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>
          数据来源：Frankfurter · {lastUpdated ? `更新于 ${lastUpdated.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}` : '加载中...'}
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="app-card" style={{ padding: 12, marginBottom: 16, borderRadius: 10, background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#fca5a5', fontSize: 13 }}>
          ⚠️ {error}
        </div>
      )}

      {/* From 输入 */}
      <div className="app-card" style={{ padding: 14, marginBottom: 10, borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 8 }}>从（From）</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select
            className="app-select"
            value={fromCurrency}
            onChange={(e) => setFromCurrency(e.target.value)}
            style={{ flex: 1, padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(0,0,0,0.25)', color: '#fff', fontSize: 14, outline: 'none', cursor: 'pointer' }}
          >
            {currencies.map((c) => (
              <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
            ))}
          </select>
          <input
            className="app-input"
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            style={{ width: 160, padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(0,0,0,0.25)', color: '#fff', fontSize: 16, fontWeight: 600, textAlign: 'right', outline: 'none' }}
          />
        </div>
      </div>

      {/* 交换按钮 */}
      <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0 4px' }}>
        <button
          className="app-button"
          onClick={swap}
          style={{ padding: '8px 14px', borderRadius: 20, border: '1px solid rgba(124, 108, 240, 0.5)', background: 'rgba(124, 108, 240, 0.2)', color: '#fff', cursor: 'pointer', fontSize: 13 }}
        >
          ⇅ 交换（{fromCurrency} ↔ {toCurrency}）
        </button>
      </div>

      {/* To 输入（双向） */}
      <div className="app-card" style={{ padding: 14, marginBottom: 10, borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 8 }}>到（To）</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select
            className="app-select"
            value={toCurrency}
            onChange={(e) => setToCurrency(e.target.value)}
            style={{ flex: 1, padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(124, 108, 240, 0.5)', background: 'rgba(124, 108, 240, 0.12)', color: '#fff', fontSize: 14, outline: 'none', cursor: 'pointer' }}
          >
            {currencies.map((c) => (
              <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
            ))}
          </select>
          <input
            className="app-input"
            type="number"
            inputMode="decimal"
            value={toAmount}
            onChange={(e) => onToAmountChange(e.target.value)}
            placeholder="0.00"
            style={{ width: 160, padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(124, 108, 240, 0.5)', background: 'rgba(124, 108, 240, 0.12)', color: '#7c6cf0', fontSize: 16, fontWeight: 700, textAlign: 'right', outline: 'none' }}
          />
        </div>
      </div>

      {/* 实时汇率显示 */}
      <div className="app-card" style={{ padding: 16, marginBottom: 16, borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 6 }}>当前汇率</div>
        {loading && !rate ? (
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>加载中...</div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)' }}>
              1 {fromCurrency} {fromCurrencyInfo?.name ? `（${fromCurrencyInfo.name}）` : ''}
            </span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>=</span>
            <span style={{ fontSize: 22, fontWeight: 700, color: '#a5b4fc' }}>
              {rate ? rate.toFixed(4) : '—'}
            </span>
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)' }}>
              {toCurrency} {toCurrencyInfo?.name ? `（${toCurrencyInfo.name}）` : ''}
            </span>
          </div>
        )}
        {/* 反向汇率 */}
        {rate && rate > 0 && (
          <div style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
            反向：1 {toCurrency} ≈ {(1 / rate).toFixed(4)} {fromCurrency}
          </div>
        )}
      </div>

      {/* 快速金额按钮 */}
      <div className="app-card" style={{ padding: 14, marginBottom: 16, borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 10 }}>快速金额（从 {fromCurrency}）</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {QUICK_AMOUNTS.map((v) => (
            <button
              key={v}
              className="chip"
              onClick={() => setQuickAmount(v)}
              style={{
                padding: '8px 14px',
                borderRadius: 20,
                border: '1px solid rgba(255,255,255,0.12)',
                background: amount === String(v) ? 'rgba(124, 108, 240, 0.3)' : 'rgba(255,255,255,0.06)',
                color: '#fff',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {v.toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      {/* 历史 30 天 sparkline */}
      <div className="app-card" style={{ padding: 14, marginBottom: 16, borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>📈 近 30 天汇率走势（{fromCurrency}→{toCurrency}）</div>
          {historyLoading && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>加载中...</div>}
        </div>
        {rateHistory.length > 0 ? (
          <RateSparkline data={rateHistory} color="#7c6cf0" />
        ) : (
          <div style={{ textAlign: 'center', padding: 20, fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
            暂无历史数据（或 {fromCurrency} 与 {toCurrency} 之间无可用历史）
          </div>
        )}
      </div>

      {/* 常用参考汇率 */}
      <div className="app-card" style={{ padding: 14, borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 10 }}>常用参考（基于 {fromCurrency}）</div>
        <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
          {POPULAR.filter((c) => c.code !== fromCurrency).slice(0, 8).map((c) => (
            <RefRateItem key={c.code} from={fromCurrency} to={c.code} currencyName={c.name} />
          ))}
        </div>
      </div>
    </div>
  )
}

// 子组件：获取并展示参考汇率
function RefRateItem({ from, to, currencyName }: { from: string; to: string; currencyName: string }) {
  const [rate, setRate] = useState<number | null>(null)
  useEffect(() => {
    let cancelled = false
    fetch(`https://api.frankfurter.app/latest?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((data) => {
        if (cancelled) return
        const v: number | undefined = data.rates?.[to]
        if (typeof v === 'number') setRate(v)
      })
      .catch(() => {
        /* 静默忽略 */
      })
    return () => {
      cancelled = true
    }
  }, [from, to])

  return (
    <div
      className="app-card"
      style={{
        padding: 10,
        borderRadius: 8,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        fontSize: 12,
      }}
    >
      <div style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>{to}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{rate ? rate.toFixed(4) : '—'}</div>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{currencyName}</div>
    </div>
  )
}
