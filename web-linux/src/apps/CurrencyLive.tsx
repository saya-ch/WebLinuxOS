import { useState, useEffect, useCallback } from 'react'
import type { CSSProperties } from 'react'
import { useStore } from '../store'

const API_BASE = 'https://api.frankfurter.app'

const CURRENCIES: { code: string; name: string; flag: string }[] = [
  { code: 'USD', name: '美元', flag: '🇺🇸' },
  { code: 'EUR', name: '欧元', flag: '🇪🇺' },
  { code: 'GBP', name: '英镑', flag: '🇬🇧' },
  { code: 'JPY', name: '日元', flag: '🇯🇵' },
  { code: 'CNY', name: '人民币', flag: '🇨🇳' },
  { code: 'HKD', name: '港币', flag: '🇭🇰' },
  { code: 'AUD', name: '澳元', flag: '🇦🇺' },
  { code: 'CAD', name: '加元', flag: '🇨🇦' },
  { code: 'CHF', name: '瑞士法郎', flag: '🇨🇭' },
  { code: 'SGD', name: '新加坡元', flag: '🇸🇬' },
  { code: 'KRW', name: '韩元', flag: '🇰🇷' },
  { code: 'INR', name: '印度卢比', flag: '🇮🇳' },
  { code: 'BRL', name: '巴西雷亚尔', flag: '🇧🇷' },
  { code: 'ZAR', name: '南非兰特', flag: '🇿🇦' },
  { code: 'MXN', name: '墨西哥比索', flag: '🇲🇽' },
  { code: 'SEK', name: '瑞典克朗', flag: '🇸🇪' },
  { code: 'NOK', name: '挪威克朗', flag: '🇳🇴' },
  { code: 'DKK', name: '丹麦克朗', flag: '🇩🇰' },
  { code: 'NZD', name: '新西兰元', flag: '🇳🇿' },
  { code: 'THB', name: '泰铢', flag: '🇹🇭' },
]

interface RateData {
  amount: number
  base: string
  date: string
  rates: Record<string, number>
}

interface HistoryPoint {
  date: string
  rate: number
}

export default function CurrencyLive() {
  const addNotification = useStore((s) => s.addNotification)
  const [baseCurrency, setBaseCurrency] = useState('USD')
  const [targetCurrency, setTargetCurrency] = useState('CNY')
  const [amount, setAmount] = useState('1')
  const [rate, setRate] = useState<number | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')
  const [history, setHistory] = useState<HistoryPoint[]>([])
  const [loading, setLoading] = useState(false)
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('currency-live-favorites')
      return saved ? JSON.parse(saved) : ['USD-CNY', 'EUR-USD', 'GBP-JPY']
    } catch { return ['USD-CNY', 'EUR-USD', 'GBP-JPY'] }
  })
  const [historyDays, setHistoryDays] = useState(30)

  useEffect(() => {
    localStorage.setItem('currency-live-favorites', JSON.stringify(favorites))
  }, [favorites])

  const copyToClipboard = useCallback((text: string) => {
    try {
      navigator.clipboard.writeText(text)
      addNotification({ title: '已复制', message: '汇率已复制到剪贴板', type: 'success' })
    } catch {}
  }, [addNotification])

  const fetchRate = useCallback(async () => {
    if (!baseCurrency || !targetCurrency || baseCurrency === targetCurrency) {
      setRate(1)
      return
    }
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/latest?from=${baseCurrency}&to=${targetCurrency}`)
      const data: RateData = await response.json()
      setRate(data.rates[targetCurrency])
      setLastUpdated(data.date)
      
      const numAmount = parseFloat(amount) || 1
      const converted = (numAmount * data.rates[targetCurrency]).toFixed(4)
      
      addNotification({
        title: '汇率更新',
        message: `${numAmount} ${baseCurrency} = ${converted} ${targetCurrency}`,
        type: 'success',
        duration: 3000
      })
    } catch (err) {
      addNotification({ title: '获取失败', message: '无法获取实时汇率', type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [baseCurrency, targetCurrency, amount, addNotification])

  const fetchHistory = useCallback(async () => {
    if (baseCurrency === targetCurrency) {
      setHistory([])
      return
    }
    try {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - historyDays)
      
      const from = startDate.toISOString().split('T')[0]
      const to = endDate.toISOString().split('T')[0]
      
      const response = await fetch(`${API_BASE}/${from}..${to}?from=${baseCurrency}&to=${targetCurrency}`)
      const data = await response.json() as { rates: Record<string, Record<string, number>> }
      
      if (data.rates) {
        const points: HistoryPoint[] = Object.entries(data.rates)
          .map(([date, rates]) => ({
            date,
            rate: rates[targetCurrency] || 0
          }))
          .sort((a, b) => a.date.localeCompare(b.date))
        setHistory(points)
      }
    } catch {}
  }, [baseCurrency, targetCurrency, historyDays])

  useEffect(() => {
    fetchRate()
    fetchHistory()
  }, [fetchRate, fetchHistory])

  const swapCurrencies = () => {
    setBaseCurrency(targetCurrency)
    setTargetCurrency(baseCurrency)
  }

  const addFavorite = () => {
    const pair = `${baseCurrency}-${targetCurrency}`
    if (!favorites.includes(pair)) {
      setFavorites(prev => [...prev, pair])
      addNotification({ title: '已收藏', message: `${pair} 已添加到收藏`, type: 'success' })
    }
  }

  const removeFavorite = (pair: string) => {
    setFavorites(prev => prev.filter(p => p !== pair))
  }

  const useFavorite = (pair: string) => {
    const [from, to] = pair.split('-')
    setBaseCurrency(from)
    setTargetCurrency(to)
  }

  const getCurrencyInfo = (code: string) => CURRENCIES.find(c => c.code === code)

  const numAmount = parseFloat(amount) || 1
  const converted = rate ? (numAmount * rate).toFixed(4) : '...'

  const maxRate = history.length > 0 ? Math.max(...history.map(h => h.rate)) : 0
  const minRate = history.length > 0 ? Math.min(...history.map(h => h.rate)) : 0
  const avgRate = history.length > 0 ? history.reduce((sum, h) => sum + h.rate, 0) / history.length : 0
  const currentRate = history.length > 0 ? history[history.length - 1].rate : 0
  const change = history.length > 1 ? ((currentRate - history[0].rate) / history[0].rate * 100).toFixed(2) : '0'
  const isPositive = parseFloat(change) >= 0

  const styles: Record<string, CSSProperties> = {
    container: { height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--window-bg)', color: 'var(--text-primary)' },
    header: { padding: '16px 20px', borderBottom: '1px solid var(--window-border)', background: 'linear-gradient(135deg, var(--window-bg), var(--desktop-bg))', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    title: { fontSize: 18, fontWeight: 700 },
    subtitle: { fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 },
    content: { flex: 1, overflow: 'auto', padding: 20 },
    card: { background: 'rgba(255,255,255,0.04)', border: '1px solid var(--window-border)', borderRadius: 12, padding: 20, marginBottom: 16 },
    converterBox: { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
    currencySelect: { padding: '12px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--window-border)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 16, fontWeight: 600, minWidth: 140 },
    amountInput: { padding: '14px 18px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--window-border)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 24, fontWeight: 700, width: 160, outline: 'none' },
    swapBtn: { width: 44, height: 44, borderRadius: '50%', background: 'var(--accent)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 },
    resultDisplay: { textAlign: 'center', padding: '24px', background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(56,189,248,0.1))', borderRadius: 12, marginTop: 16 },
    resultAmount: { fontSize: 36, fontWeight: 800, letterSpacing: '-0.02em' },
    resultRate: { fontSize: 14, color: 'var(--text-secondary)', marginTop: 8 },
    statRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 16 },
    stat: { textAlign: 'center', padding: '12px', background: 'rgba(255,255,255,0.04)', borderRadius: 8 },
    statLabel: { fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' },
    statValue: { fontSize: 16, fontWeight: 700, marginTop: 4 },
    favTag: { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 12px', background: 'rgba(255,255,255,0.08)', borderRadius: 16, fontSize: 12, cursor: 'pointer', border: '1px solid var(--window-border)' },
    removeBtn: { background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0 2px', fontSize: 14 },
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <div style={styles.title}>实时汇率 Pro</div>
          <div style={styles.subtitle}>基于 Frankfurter API · 数据更新于 {lastUpdated || '...'}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{ ...styles.swapBtn, width: 'auto', borderRadius: 8, padding: '0 16px', fontSize: 13 }} onClick={fetchRate} disabled={loading}>
            {loading ? '...' : '🔄 刷新'}
          </button>
          <button style={{ ...styles.swapBtn, width: 'auto', borderRadius: 8, padding: '0 16px', fontSize: 13, background: 'rgba(255,255,255,0.08)' }} onClick={addFavorite}>
            ⭐ 收藏
          </button>
        </div>
      </div>

      <div style={styles.content}>
        <div style={styles.card}>
          <div style={styles.converterBox}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6 }}>从</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input style={styles.amountInput} type="number" value={amount} onChange={e => setAmount(e.target.value)} min="0" step="0.01" />
                <select style={styles.currencySelect} value={baseCurrency} onChange={e => setBaseCurrency(e.target.value)}>
                  {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
                </select>
              </div>
            </div>
            
            <button style={styles.swapBtn} onClick={swapCurrencies} title="交换货币">⇌</button>
            
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6 }}>到</div>
              <select style={{ ...styles.currencySelect, width: '100%' }} value={targetCurrency} onChange={e => setTargetCurrency(e.target.value)}>
                {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
              </select>
            </div>
          </div>

          <div style={styles.resultDisplay}>
            <div style={styles.resultAmount}>{converted}</div>
            <div style={styles.resultRate}>
              {numAmount} {baseCurrency} = {converted} {targetCurrency}
            </div>
            <div style={{ fontSize: 12, color: isPositive ? '#10b981' : '#ef4444', marginTop: 8 }}>
              {change !== '0' && (isPositive ? '▲' : '▼')} {change}% ({historyDays}天)
            </div>
          </div>

          <div style={styles.statRow}>
            <div style={styles.stat}>
              <div style={styles.statLabel}>最高</div>
              <div style={styles.statValue}>{maxRate.toFixed(4)}</div>
            </div>
            <div style={styles.stat}>
              <div style={styles.statLabel}>最低</div>
              <div style={styles.statValue}>{minRate.toFixed(4)}</div>
            </div>
            <div style={styles.stat}>
              <div style={styles.statLabel}>平均</div>
              <div style={styles.statValue}>{avgRate.toFixed(4)}</div>
            </div>
            <div style={styles.stat}>
              <div style={styles.statLabel}>当前</div>
              <div style={styles.statValue}>{currentRate.toFixed(4)}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16 }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>历史周期：</span>
            {[7, 30, 90, 365].map(d => (
              <button key={d} style={{
                padding: '4px 12px', background: historyDays === d ? 'var(--accent)' : 'rgba(255,255,255,0.06)',
                border: '1px solid var(--window-border)', borderRadius: 6, color: historyDays === d ? '#fff' : 'var(--text-primary)',
                fontSize: 12, cursor: 'pointer',
              }} onClick={() => setHistoryDays(d)}>{d}天</button>
            ))}
          </div>
        </div>

        <div style={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600 }}>历史走势图</h3>
            <button style={{ ...styles.swapBtn, width: 'auto', borderRadius: 6, padding: '4px 10px', fontSize: 11, background: 'rgba(255,255,255,0.08)' }} onClick={() => copyToClipboard(`${numAmount} ${baseCurrency} = ${converted} ${targetCurrency}`)}>
              📋 复制
            </button>
          </div>
          
          {history.length > 1 ? (
            <svg viewBox="0 0 600 150" style={{ width: '100%', height: 150 }}>
              {(() => {
                const rates = history.map(h => h.rate)
                const min = Math.min(...rates) * 0.998
                const max = Math.max(...rates) * 1.002
                const range = max - min || 1
                const width = 600
                const height = 150
                const padX = 20
                const padY = 20
                
                const points = history.map((h, i) => {
                  const x = padX + (i / (history.length - 1)) * (width - 2 * padX)
                  const y = padY + (1 - (h.rate - min) / range) * (height - 2 * padY)
                  return `${x},${y}`
                })
                
                const linePath = `M${points.join(' L')}`
                const areaPath = `M${padX},${height - padY} L${points.join(' L')} L${width - padX},${height - padY}`
                
                return (
                  <>
                    <defs>
                      <linearGradient id="rateGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity="0.3" />
                        <stop offset="100%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d={areaPath} fill="url(#rateGrad)" />
                    <path d={linePath} fill="none" stroke={isPositive ? '#10b981' : '#ef4444'} strokeWidth="2" />
                    {history.map((h, i) => {
                      if (i === 0 || i === history.length - 1 || i % Math.max(1, Math.floor(history.length / 10)) === 0) {
                        const x = padX + (i / (history.length - 1)) * (width - 2 * padX)
                        const y = padY + (1 - (h.rate - min) / range) * (height - 2 * padY)
                        return <circle key={i} cx={x} cy={y} r="3" fill={isPositive ? '#10b981' : '#ef4444'} />
                      }
                      return null
                    })}
                  </>
                )
              })()}
            </svg>
          ) : (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
              加载历史数据中...
            </div>
          )}
          
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-secondary)', marginTop: 8 }}>
            <span>{history[0]?.date || '...'}</span>
            <span>{history[history.length - 1]?.date || '...'}</span>
          </div>
        </div>

        <div style={styles.card}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>⭐ 我的收藏</h3>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {favorites.length === 0 ? (
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>暂无收藏，点击"⭐ 收藏"按钮添加</span>
            ) : (
              favorites.map(pair => {
                const [from, to] = pair.split('-')
                const fromInfo = getCurrencyInfo(from)
                const toInfo = getCurrencyInfo(to)
                return (
                  <div key={pair} style={styles.favTag} onClick={() => useFavorite(pair)}>
                    <span>{fromInfo?.flag} {from}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>→</span>
                    <span>{toInfo?.flag} {to}</span>
                    <button style={styles.removeBtn} onClick={(e) => { e.stopPropagation(); removeFavorite(pair) }}>×</button>
                  </div>
                )
              })
            )}
          </div>
        </div>

        <div style={styles.card}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>💱 常用货币对速查</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
            {[
              { from: 'USD', to: 'CNY' }, { from: 'EUR', to: 'USD' }, { from: 'GBP', to: 'CNY' },
              { from: 'JPY', to: 'USD' }, { from: 'USD', to: 'JPY' }, { from: 'HKD', to: 'CNY' },
              { from: 'AUD', to: 'USD' }, { from: 'EUR', to: 'JPY' }, { from: 'GBP', to: 'EUR' },
            ].map(({ from, to }) => {
              const fromInfo = getCurrencyInfo(from)
              const toInfo = getCurrencyInfo(to)
              return (
                <button key={`${from}-${to}`} style={{
                  padding: '10px 14px', background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--window-border)', borderRadius: 8,
                  color: 'var(--text-primary)', cursor: 'pointer', textAlign: 'left',
                  fontSize: 13,
                }} onClick={() => { setBaseCurrency(from); setTargetCurrency(to) }}>
                  {fromInfo?.flag} {from} <span style={{ color: 'var(--text-secondary)' }}>→</span> {toInfo?.flag} {to}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}