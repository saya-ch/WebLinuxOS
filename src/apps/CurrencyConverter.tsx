import { useState, useEffect, useCallback } from 'react'

interface ExchangeRate {
  from: string
  to: string
  rate: number
  date: string
}

interface CurrencyInfo {
  code: string
  name: string
  symbol: string
}

const CURRENCIES: CurrencyInfo[] = [
  { code: 'USD', name: '美元', symbol: '$' },
  { code: 'EUR', name: '欧元', symbol: '€' },
  { code: 'GBP', name: '英镑', symbol: '£' },
  { code: 'JPY', name: '日元', symbol: '¥' },
  { code: 'CNY', name: '人民币', symbol: '¥' },
  { code: 'AUD', name: '澳元', symbol: 'A$' },
  { code: 'CAD', name: '加元', symbol: 'C$' },
  { code: 'CHF', name: '瑞士法郎', symbol: 'CHF' },
  { code: 'HKD', name: '港币', symbol: 'HK$' },
  { code: 'KRW', name: '韩元', symbol: '₩' },
  { code: 'SGD', name: '新加坡元', symbol: 'S$' },
  { code: 'NZD', name: '新西兰元', symbol: 'NZ$' },
  { code: 'INR', name: '印度卢比', symbol: '₹' },
  { code: 'MXN', name: '墨西哥比索', symbol: '$' },
  { code: 'BRL', name: '巴西雷亚尔', symbol: 'R$' },
  { code: 'RUB', name: '俄罗斯卢布', symbol: '₽' },
  { code: 'ZAR', name: '南非兰特', symbol: 'R' },
  { code: 'TRY', name: '土耳其里拉', symbol: '₺' },
  { code: 'SEK', name: '瑞典克朗', symbol: 'kr' },
  { code: 'NOK', name: '挪威克朗', symbol: 'kr' },
]

export default function CurrencyConverter() {
  const [fromCurrency, setFromCurrency] = useState('USD')
  const [toCurrency, setToCurrency] = useState('CNY')
  const [amount, setAmount] = useState('100')
  const [rate, setRate] = useState<number | null>(null)
  const [rateDate, setRateDate] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<ExchangeRate[]>([])

  const fetchRate = useCallback(async (from: string, to: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(
        `https://api.frankfurter.app/latest?from=${from}&to=${to}`
      )
      if (!response.ok) throw new Error('网络请求失败')
      const data = await response.json()
      const rateValue = data.rates[to]
      setRate(rateValue)
      setRateDate(data.date)
      
      // 添加到历史记录
      const newEntry: ExchangeRate = {
        from,
        to,
        rate: rateValue,
        date: data.date,
      }
      setHistory(prev => {
        const filtered = prev.filter(h => h.from !== from || h.to !== to)
        return [newEntry, ...filtered].slice(0, 10)
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取汇率失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRate(fromCurrency, toCurrency)
  }, [fromCurrency, toCurrency, fetchRate])

  const handleSwap = () => {
    setFromCurrency(toCurrency)
    setToCurrency(fromCurrency)
  }

  const convertedAmount = rate ? (parseFloat(amount) * rate).toFixed(2) : '0'

  const getCurrencyInfo = (code: string) => 
    CURRENCIES.find(c => c.code === code) || { code, name: code, symbol: '' }

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
          💱 汇率转换器
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
          实时汇率数据 (Frankfurter.app)
        </div>
      </div>

      {/* 转换面板 */}
      <div style={{ 
        background: 'rgba(255,255,255,0.05)', 
        borderRadius: 12, 
        padding: 20,
        marginBottom: 20
      }}>
        {/* 输入金额 */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>
            输入金额
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: 'var(--window-bg)',
              border: '1px solid var(--window-border)',
              borderRadius: 8,
              color: 'var(--text-primary)',
              fontSize: 18,
              fontWeight: 500,
              outline: 'none',
            }}
          />
        </div>

        {/* 源货币 */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>
            源货币
          </label>
          <select
            value={fromCurrency}
            onChange={(e) => setFromCurrency(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: 'var(--window-bg)',
              border: '1px solid var(--window-border)',
              borderRadius: 8,
              color: 'var(--text-primary)',
              fontSize: 14,
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            {CURRENCIES.map(c => (
              <option key={c.code} value={c.code}>
                {c.symbol} {c.code} - {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* 交换按钮 */}
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <button
            onClick={handleSwap}
            style={{
              padding: '10px 20px',
              background: 'var(--accent)',
              border: 'none',
              borderRadius: 8,
              color: '#fff',
              fontSize: 14,
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
          >
            ⇅ 交换
          </button>
        </div>

        {/* 目标货币 */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>
            目标货币
          </label>
          <select
            value={toCurrency}
            onChange={(e) => setToCurrency(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: 'var(--window-bg)',
              border: '1px solid var(--window-border)',
              borderRadius: 8,
              color: 'var(--text-primary)',
              fontSize: 14,
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            {CURRENCIES.map(c => (
              <option key={c.code} value={c.code}>
                {c.symbol} {c.code} - {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* 结果 */}
        <div style={{ 
          background: 'var(--accent-bg)', 
          borderRadius: 8, 
          padding: 16,
          textAlign: 'center'
        }}>
          {loading ? (
            <div style={{ color: 'var(--text-secondary)' }}>加载中...</div>
          ) : error ? (
            <div style={{ color: '#f44747' }}>{error}</div>
          ) : rate ? (
            <>
              <div style={{ fontSize: 28, fontWeight: 600, color: 'var(--accent)' }}>
                {getCurrencyInfo(toCurrency).symbol} {convertedAmount}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8 }}>
                1 {fromCurrency} = {rate.toFixed(4)} {toCurrency}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
                数据日期: {rateDate}
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* 历史记录 */}
      {history.length > 0 && (
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: 'var(--text-primary)' }}>
            最近查询
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {history.map((h, i) => (
              <div
                key={i}
                onClick={() => {
                  setFromCurrency(h.from)
                  setToCurrency(h.to)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  background: 'rgba(255,255,255,0.04)',
                  borderRadius: 8,
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
              >
                <span style={{ fontWeight: 500 }}>
                  {h.from} → {h.to}
                </span>
                <span style={{ color: 'var(--accent)', fontWeight: 500 }}>
                  {h.rate.toFixed(4)}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                  {h.date}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 数据来源 */}
      <div style={{ textAlign: 'center', marginTop: 16, fontSize: 11, color: 'var(--text-secondary)' }}>
        数据来源: Frankfurter.app (欧洲央行汇率)
      </div>
    </div>
  )
}