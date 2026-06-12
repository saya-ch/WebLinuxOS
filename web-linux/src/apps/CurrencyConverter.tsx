import { useState, useEffect, useMemo, useCallback } from 'react'

interface ExchangeRates {
  [currency: string]: number
}

interface Currency {
  code: string
  name: string
  symbol: string
  flag: string
}

const CURRENCIES: Currency[] = [
  { code: 'USD', name: '美元', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', name: '欧元', symbol: '€', flag: '🇪🇺' },
  { code: 'GBP', name: '英镑', symbol: '£', flag: '🇬🇧' },
  { code: 'JPY', name: '日元', symbol: '¥', flag: '🇯🇵' },
  { code: 'CNY', name: '人民币', symbol: '¥', flag: '🇨🇳' },
  { code: 'AUD', name: '澳元', symbol: 'A$', flag: '🇦🇺' },
  { code: 'CAD', name: '加元', symbol: 'C$', flag: '🇨🇦' },
  { code: 'CHF', name: '瑞郎', symbol: 'Fr', flag: '🇨🇭' },
  { code: 'HKD', name: '港币', symbol: 'HK$', flag: '🇭🇰' },
  { code: 'KRW', name: '韩元', symbol: '₩', flag: '🇰🇷' },
  { code: 'SGD', name: '新加坡元', symbol: 'S$', flag: '🇸🇬' },
  { code: 'INR', name: '印度卢比', symbol: '₹', flag: '🇮🇳' },
  { code: 'MXN', name: '墨西哥比索', symbol: '$', flag: '🇲🇽' },
  { code: 'TWD', name: '新台币', symbol: 'NT$', flag: '🇹🇼' },
  { code: 'ZAR', name: '南非兰特', symbol: 'R', flag: '🇿🇦' },
  { code: 'BRL', name: '巴西雷亚尔', symbol: 'R$', flag: '🇧🇷' },
  { code: 'DKK', name: '丹麦克朗', symbol: 'kr', flag: '🇩🇰' },
  { code: 'NOK', name: '挪威克朗', symbol: 'kr', flag: '🇳🇴' },
  { code: 'SEK', name: '瑞典克朗', symbol: 'kr', flag: '🇸🇪' },
  { code: 'NZD', name: '新西兰元', symbol: 'NZ$', flag: '🇳🇿' },
]

const FALLBACK_RATES: ExchangeRates = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 151.23,
  CNY: 7.24,
  AUD: 1.53,
  CAD: 1.35,
  CHF: 0.88,
  HKD: 7.85,
  KRW: 1320.45,
  SGD: 1.34,
  INR: 83.12,
  MXN: 17.89,
  TWD: 31.45,
  ZAR: 18.76,
  BRL: 5.02,
  DKK: 6.87,
  NOK: 10.89,
  SEK: 10.56,
  NZD: 1.65,
}

const CACHE_KEY = 'weblinux-currency-rates-v1'
const CACHE_TTL = 60 * 60 * 1000 // 1 hour

function getCachedRates(): { rates: ExchangeRates; timestamp: number } | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (Date.now() - parsed.timestamp > CACHE_TTL) return null
    return parsed
  } catch {
    return null
  }
}

function setCachedRates(rates: ExchangeRates) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ rates, timestamp: Date.now() }))
  } catch { /* ignore */ }
}

export default function CurrencyConverter() {
  const [fromCurrency, setFromCurrency] = useState<string>('USD')
  const [toCurrency, setToCurrency] = useState<string>('CNY')
  const [fromAmount, setFromAmount] = useState<string>('100')
  const [toAmount, setToAmount] = useState<string>('')
  const [rates, setRates] = useState<ExchangeRates>({})
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [history, setHistory] = useState<{ from: string; to: string; amount: string; result: string; time: Date }[]>([])

  const fetchRates = useCallback(async () => {
    // 先命中缓存
    const cached = getCachedRates()
    if (cached) {
      setRates(cached.rates)
      setLastUpdated(new Date(cached.timestamp))
      setLoading(false)
    }

    try {
      const response = await fetch('https://open.er-api.com/v6/latest/USD')
      if (!response.ok) {
        throw new Error(`服务返回错误: ${response.status}`)
      }
      const data = await response.json()
      if (data && data.rates && typeof data.rates === 'object') {
        setRates(data.rates)
        setLastUpdated(new Date())
        setCachedRates(data.rates)
        setErrorMsg(null)
      } else {
        throw new Error('返回的数据格式不正确')
      }
    } catch (err) {
      console.warn('Currency fetch failed:', err)
      if (!cached) {
        setRates(FALLBACK_RATES)
        setLastUpdated(new Date())
      }
      setErrorMsg('实时汇率获取失败，' + (cached ? '使用缓存汇率' : '使用参考汇率'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRates()
    const interval = setInterval(fetchRates, 60 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchRates])

  const convert = useMemo(() => {
    if (!rates[fromCurrency] || !rates[toCurrency] || !fromAmount || isNaN(parseFloat(fromAmount))) {
      return ''
    }

    const amount = parseFloat(fromAmount)
    const usdAmount = amount / rates[fromCurrency]
    const result = usdAmount * rates[toCurrency]
    return result.toFixed(2)
  }, [fromAmount, fromCurrency, toCurrency, rates])

  useEffect(() => {
    setToAmount(convert)
  }, [convert])

  const swapCurrencies = () => {
    setFromCurrency(toCurrency)
    setToCurrency(fromCurrency)
  }

  const addToHistory = () => {
    if (fromAmount && toAmount) {
      setHistory(prev => [
        { from: fromCurrency, to: toCurrency, amount: fromAmount, result: toAmount, time: new Date() },
        ...prev.slice(0, 9)
      ])
    }
  }

  const getCurrencyInfo = (code: string) => CURRENCIES.find(c => c.code === code) || CURRENCIES[0]

  const formatDate = (date: Date) => {
    return date.toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="app-container" style={{ 
      padding: '20px', 
      height: '100%', 
      overflow: 'auto',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h2 style={{ color: '#fff', margin: '0 0 8px 0', fontSize: '24px' }}>💱 汇率转换</h2>
        <p style={{ color: '#aaa', margin: 0, fontSize: '14px' }}>
          实时汇率，支持多种货币
        </p>
      </div>

      <div style={{ 
        background: 'rgba(255,255,255,0.05)', 
        borderRadius: '20px', 
        padding: '24px',
        marginBottom: '20px',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{ marginBottom: '24px' }}>
          <label style={{ color: '#aaa', fontSize: '12px', display: 'block', marginBottom: '8px' }}>
            从
          </label>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <select
              value={fromCurrency}
              onChange={(e) => setFromCurrency(e.target.value)}
              style={{
                flex: 1,
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.05)',
                color: '#fff',
                fontSize: '16px',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {CURRENCIES.map(currency => (
                <option key={currency.code} value={currency.code}>
                  {currency.flag} {currency.code} - {currency.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
              placeholder="0.00"
              style={{
                width: '180px',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.05)',
                color: '#fff',
                fontSize: '20px',
                fontWeight: '600',
                textAlign: 'right',
                outline: 'none'
              }}
            />
          </div>
        </div>

        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          margin: '20px 0' 
        }}>
          <button
            onClick={swapCurrencies}
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              border: 'none',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              fontSize: '20px',
              cursor: 'pointer',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'rotate(180deg)'
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'rotate(0deg)'
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)'
            }}
          >
            ↺
          </button>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ color: '#aaa', fontSize: '12px', display: 'block', marginBottom: '8px' }}>
            到
          </label>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <select
              value={toCurrency}
              onChange={(e) => setToCurrency(e.target.value)}
              style={{
                flex: 1,
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.05)',
                color: '#fff',
                fontSize: '16px',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {CURRENCIES.map(currency => (
                <option key={currency.code} value={currency.code}>
                  {currency.flag} {currency.code} - {currency.name}
                </option>
              ))}
            </select>
            <div style={{
              width: '180px',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid rgba(102, 126, 234, 0.5)',
              background: 'rgba(102, 126, 234, 0.1)',
              color: '#fff',
              fontSize: '20px',
              fontWeight: '600',
              textAlign: 'right'
            }}>
              {toAmount || '0.00'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={addToHistory}
            style={{
              flex: 1,
              padding: '14px',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.05)',
              color: '#fff',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'background 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
            }}
          >
            保存到历史
          </button>
          <button
            onClick={fetchRates}
            style={{
              padding: '14px 20px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'opacity 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.9'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1'
            }}
          >
            🔄 刷新
          </button>
        </div>

        {lastUpdated && (
          <div style={{
            marginTop: '16px',
            textAlign: 'center',
            color: '#888',
            fontSize: '12px'
          }}>
            {loading ? '加载中...' : `最后更新: ${formatDate(lastUpdated)}`}
          </div>
        )}
        {errorMsg && (
          <div style={{
            marginTop: '8px',
            textAlign: 'center',
            color: 'rgb(239, 68, 68)',
            fontSize: '12px'
          }}>
            ⚠️ {errorMsg}
          </div>
        )}
      </div>

      <div style={{ 
        background: 'rgba(255,255,255,0.05)', 
        borderRadius: '20px', 
        padding: '20px',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <h3 style={{ color: '#fff', margin: '0 0 16px 0', fontSize: '16px' }}>
          📊 汇率参考
        </h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', 
          gap: '12px' 
        }}>
          {CURRENCIES.filter(c => c.code !== fromCurrency).slice(0, 6).map(currency => {
            const rate = rates[currency.code] ? (rates[currency.code] / rates[fromCurrency]).toFixed(4) : '--'
            return (
              <div
                key={currency.code}
                onClick={() => setToCurrency(currency.code)}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  padding: '12px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease',
                  border: toCurrency === currency.code ? '1px solid rgba(102, 126, 234, 0.5)' : '1px solid transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '20px' }}>{currency.flag}</span>
                  <span style={{ color: '#fff', fontWeight: '600' }}>{currency.code}</span>
                </div>
                <div style={{ color: '#667eea', fontWeight: '500', fontSize: '14px' }}>
                  1 {fromCurrency} = {rate} {currency.code}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {history.length > 0 && (
        <div style={{ 
          marginTop: '20px',
          background: 'rgba(255,255,255,0.05)', 
          borderRadius: '20px', 
          padding: '20px',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ color: '#fff', margin: 0, fontSize: '16px' }}>
              📜 历史记录
            </h3>
            <button
              onClick={() => setHistory([])}
              style={{
                padding: '6px 12px',
                border: 'none',
                borderRadius: '8px',
                background: 'transparent',
                color: '#888',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              清空
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {history.map((item, index) => {
              const fromInfo = getCurrencyInfo(item.from)
              const toInfo = getCurrencyInfo(item.to)
              return (
                <div
                  key={index}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    padding: '12px',
                    borderRadius: '10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ color: '#fff', fontWeight: '500' }}>
                      {fromInfo.symbol}{item.amount} {item.from} → {toInfo.symbol}{item.result} {item.to}
                    </div>
                    <div style={{ color: '#888', fontSize: '12px' }}>
                      {formatDate(item.time)}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setFromCurrency(item.from)
                      setToCurrency(item.to)
                      setFromAmount(item.amount)
                    }}
                    style={{
                      padding: '6px 12px',
                      border: 'none',
                      borderRadius: '8px',
                      background: 'rgba(102, 126, 234, 0.2)',
                      color: '#667eea',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    再次转换
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
