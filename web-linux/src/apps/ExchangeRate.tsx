import { useState, useEffect, useCallback, memo } from 'react'
import { useStore } from '../store'
import {
  RefreshCw,
  ArrowRightLeft,
  Search,
  Star,
  StarOff,
  Copy,
  Check,
  Globe,
  Calendar,
  DollarSign,
} from 'lucide-react'

// 主流货币列表
const CURRENCIES: { code: string; name: string; flag: string }[] = [
  { code: 'USD', name: '美元', flag: '🇺🇸' },
  { code: 'EUR', name: '欧元', flag: '🇪🇺' },
  { code: 'CNY', name: '人民币', flag: '🇨🇳' },
  { code: 'JPY', name: '日元', flag: '🇯🇵' },
  { code: 'GBP', name: '英镑', flag: '🇬🇧' },
  { code: 'HKD', name: '港币', flag: '🇭🇰' },
  { code: 'KRW', name: '韩元', flag: '🇰🇷' },
  { code: 'AUD', name: '澳元', flag: '🇦🇺' },
  { code: 'CAD', name: '加元', flag: '🇨🇦' },
  { code: 'CHF', name: '瑞郎', flag: '🇨🇭' },
  { code: 'SGD', name: '新加坡元', flag: '🇸🇬' },
  { code: 'NZD', name: '纽元', flag: '🇳🇿' },
  { code: 'THB', name: '泰铢', flag: '🇹🇭' },
  { code: 'MYR', name: '马币', flag: '🇲🇾' },
  { code: 'INR', name: '印度卢比', flag: '🇮🇳' },
  { code: 'BRL', name: '巴西雷亚尔', flag: '🇧🇷' },
  { code: 'RUB', name: '俄罗斯卢布', flag: '🇷🇺' },
  { code: 'ZAR', name: '南非兰特', flag: '🇿🇦' },
]

const STORAGE_KEY_FAVS = 'weblinux-exchangerate-favorites'
const STORAGE_KEY_HISTORY = 'weblinux-exchangerate-history'
const CACHE_TTL = 10 * 60 * 1000

interface RateCache {
  rates: Record<string, number>
  timestamp: number
  base: string
}

const rateCache = new Map<string, RateCache>()

function getCache(base: string): RateCache | null {
  const cached = rateCache.get(base)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached
  }
  rateCache.delete(base)
  return null
}

function setCache(base: string, data: Omit<RateCache, 'timestamp'>) {
  rateCache.set(base, { ...data, timestamp: Date.now() })
}

const ExchangeRate = memo(function ExchangeRate() {
  const [baseCurrency, setBaseCurrency] = useState('USD')
  const [targetCurrency, setTargetCurrency] = useState('CNY')
  const [amount, setAmount] = useState('1')
  const [rates, setRates] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [showSearch, setShowSearch] = useState<'base' | 'target' | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [copied, setCopied] = useState(false)
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_FAVS)
      return raw ? JSON.parse(raw) : ['EUR-CNY', 'USD-JPY']
    } catch {
      return ['EUR-CNY', 'USD-JPY']
    }
  })
  const [history, setHistory] = useState<{ from: string; to: string; rate: number; date: string }[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_HISTORY)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })

  const addNotification = useStore((s) => s.addNotification)

  const fetchRates = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh) {
      const cached = getCache(baseCurrency)
      if (cached) {
        setRates(cached.rates)
        setLastUpdated(new Date(cached.timestamp))
        return
      }
    }

    setLoading(true)
    setError(null)
    try {
      const url = `https://open.er-api.com/v6/latest/${baseCurrency}`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (data.result !== 'success') throw new Error(data['error-type'] || 'API错误')
      
      setRates(data.rates)
      setLastUpdated(new Date())
      setCache(baseCurrency, {
        rates: data.rates,
        base: data.base_code,
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : '请求失败'
      setError(`汇率获取失败：${msg}`)
      addNotification({ title: '汇率', message: '汇率数据获取失败', type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [baseCurrency, addNotification])

  useEffect(() => {
    fetchRates()
  }, [fetchRates])

  const saveFavorites = useCallback((newFavs: string[]) => {
    setFavorites(newFavs)
    try {
      localStorage.setItem(STORAGE_KEY_FAVS, JSON.stringify(newFavs))
    } catch {}
  }, [])

  const saveHistory = useCallback((newHistory: typeof history) => {
    setHistory(newHistory)
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(newHistory.slice(0, 20)))
    } catch {}
  }, [])

  const convert = useCallback(() => {
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || rates[targetCurrency]) {
      // 添加到历史
      const rate = rates[targetCurrency]
      if (rate) {
        const newEntry = {
          from: baseCurrency,
          to: targetCurrency,
          rate: numAmount * rate,
          date: new Date().toISOString(),
        }
        saveHistory([newEntry, ...history.filter(h => 
          !(h.from === newEntry.from && h.to === newEntry.to)
        )].slice(0, 20))
      }
    }
  }, [amount, rates, baseCurrency, targetCurrency, saveHistory, history])

  useEffect(() => {
    convert()
  }, [convert])

  const swapCurrencies = useCallback(() => {
    setBaseCurrency(targetCurrency)
    setTargetCurrency(baseCurrency)
  }, [baseCurrency, targetCurrency])

  const toggleFavorite = useCallback(() => {
    const pair = `${baseCurrency}-${targetCurrency}`
    const isFav = favorites.includes(pair)
    if (isFav) {
      saveFavorites(favorites.filter(f => f !== pair))
    } else {
      saveFavorites([pair, ...favorites])
      addNotification({ title: '收藏', message: `${pair} 已添加到收藏`, type: 'success', duration: 2000 })
    }
  }, [baseCurrency, targetCurrency, favorites, saveFavorites, addNotification])

  const isFavorite = favorites.includes(`${baseCurrency}-${targetCurrency}`)

  const copyResult = useCallback(() => {
    const result = calculateResult()
    if (result) {
      navigator.clipboard.writeText(`${amount} ${baseCurrency} = ${result} ${targetCurrency}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [amount, baseCurrency, targetCurrency])

  const calculateResult = useCallback((): string | null => {
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || !rates[targetCurrency]) return null
    const result = numAmount * rates[targetCurrency]
    return result.toFixed(4).replace(/\.?0+$/, '')
  }, [amount, rates, targetCurrency])

  const filteredCurrencies = CURRENCIES.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getCurrencyInfo = (code: string) => 
    CURRENCIES.find(c => c.code === code) || { code, name: code, flag: '🏳️' }

  return (
    <div
      style={{
        height: '100%',
        overflowY: 'auto',
        padding: 24,
        background: 'linear-gradient(180deg, var(--window-bg) 0%, var(--desktop-bg) 100%)',
        color: 'var(--text-primary)',
      }}
    >
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .exch-card {
          animation: fadeSlideUp 0.4s ease-out both;
        }
        .exch-card-delay-1 { animation-delay: 0.05s; }
        .exch-card-delay-2 { animation-delay: 0.1s; }
        .exch-card-delay-3 { animation-delay: 0.15s; }
      `}</style>

      {/* 头部 */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }} className="exch-card">
        <div style={{
          width: 48, height: 48, borderRadius: 14,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <DollarSign size={24} color="white" />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>实时汇率转换</h2>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>
            基于 ExchangeRate-API 公开接口
          </p>
        </div>
      </div>

      {/* 转换器主体 */}
      <div style={{
        padding: 24,
        borderRadius: 20,
        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.05) 100%)',
        border: '1px solid var(--glass-border)',
        backdropFilter: 'blur(20px)',
        marginBottom: 20,
        animation: 'fadeSlideUp 0.4s ease-out 0.1s both',
      }}>
        {/* 基础货币输入 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 16, alignItems: 'center' }}>
          {/* 源货币 */}
          <div style={{
            padding: 20,
            borderRadius: 16,
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
          }}>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              从
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 24 }}>{getCurrencyInfo(baseCurrency).flag}</span>
              <button
                onClick={() => { setShowSearch('base'); setSearchQuery('') }}
                style={{
                  background: 'transparent', border: 'none', color: 'var(--text-primary)',
                  cursor: 'pointer', fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                {baseCurrency}
                <Search size={14} style={{ color: 'var(--text-secondary)' }} />
              </button>
            </div>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={{
                width: '100%', fontSize: 32, fontWeight: 700,
                background: 'transparent', border: 'none', color: 'var(--text-primary)',
                outline: 'none',
              }}
            />
          </div>

          {/* 交换按钮 */}
          <button
            onClick={swapCurrencies}
            style={{
              width: 48, height: 48, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent) 0%, #a29bfe 100%)',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white',
              transition: 'transform 0.3s ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'rotate(180deg)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'rotate(0deg)')}
          >
            <ArrowRightLeft size={20} />
          </button>

          {/* 目标货币 */}
          <div style={{
            padding: 20,
            borderRadius: 16,
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
          }}>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              到
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 24 }}>{getCurrencyInfo(targetCurrency).flag}</span>
              <button
                onClick={() => { setShowSearch('target'); setSearchQuery('') }}
                style={{
                  background: 'transparent', border: 'none', color: 'var(--text-primary)',
                  cursor: 'pointer', fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                {targetCurrency}
                <Search size={14} style={{ color: 'var(--text-secondary)' }} />
              </button>
            </div>
            <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--accent)' }}>
              {calculateResult() || '—'}
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
          <button
            onClick={() => fetchRates(true)}
            disabled={loading}
            style={{
              padding: '10px 16px', borderRadius: 10,
              background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
              color: 'var(--text-primary)', cursor: loading ? 'wait' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 6, fontSize: 13,
            }}
          >
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            {loading ? '刷新中' : '刷新汇率'}
          </button>
          <button
            onClick={toggleFavorite}
            style={{
              padding: '10px 16px', borderRadius: 10,
              background: isFavorite ? 'rgba(251, 191, 36, 0.15)' : 'var(--glass-bg)',
              border: `1px solid ${isFavorite ? 'rgba(251, 191, 36, 0.3)' : 'var(--glass-border)'}`,
              color: isFavorite ? '#f59e0b' : 'var(--text-primary)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13,
            }}
          >
            {isFavorite ? <Star size={14} fill="#f59e0b" /> : <StarOff size={14} />}
            {isFavorite ? '已收藏' : '收藏'}
          </button>
          <button
            onClick={copyResult}
            style={{
              padding: '10px 16px', borderRadius: 10,
              background: copied ? 'rgba(16, 185, 129, 0.15)' : 'var(--glass-bg)',
              border: `1px solid ${copied ? 'rgba(16, 185, 129, 0.3)' : 'var(--glass-border)'}`,
              color: copied ? '#10b981' : 'var(--text-primary)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13,
            }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? '已复制' : '复制结果'}
          </button>
        </div>

        {/* 汇率信息 */}
        {rates[targetCurrency] && (
          <div style={{
            marginTop: 16, padding: 14, borderRadius: 12,
            background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)',
            fontSize: 13,
          }}>
            <div style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>
              1 {baseCurrency} = {rates[targetCurrency].toFixed(4)} {targetCurrency}
            </div>
            {lastUpdated && (
              <div style={{ color: 'var(--text-secondary)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Calendar size={12} />
                更新于 {lastUpdated.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
          </div>
        )}

        {error && (
          <div style={{
            marginTop: 16, padding: 14, borderRadius: 12,
            background: 'var(--error-bg)', border: '1px solid var(--error)',
            color: 'var(--error)', fontSize: 13,
          }}>
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* 货币选择器 */}
      {showSearch && (
        <div style={{
          padding: 16,
          borderRadius: 16,
          background: 'var(--glass-bg)',
          border: '1px solid var(--glass-border)',
          marginBottom: 20,
          animation: 'fadeSlideUp 0.3s ease-out',
        }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <Search size={16} style={{ color: 'var(--text-secondary)' }} />
            <input
              type="text"
              placeholder="搜索货币..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              style={{
                flex: 1, background: 'transparent', border: 'none',
                color: 'var(--text-primary)', outline: 'none', fontSize: 14,
              }}
            />
            <button
              onClick={() => setShowSearch(null)}
              style={{
                background: 'transparent', border: 'none', color: 'var(--text-secondary)',
                cursor: 'pointer', fontSize: 14,
              }}
            >
              取消
            </button>
          </div>
          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
            {filteredCurrencies.map(c => (
              <button
                key={c.code}
                onClick={() => {
                  if (showSearch === 'base') setBaseCurrency(c.code)
                  else setTargetCurrency(c.code)
                  setShowSearch(null)
                }}
                style={{
                  width: '100%', padding: '10px 12px',
                  background: 'transparent', border: 'none',
                  color: 'var(--text-primary)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 10,
                  borderRadius: 8, fontSize: 14,
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-bg)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{ fontSize: 20 }}>{c.flag}</span>
                <span style={{ fontWeight: 600 }}>{c.code}</span>
                <span style={{ color: 'var(--text-secondary)', marginLeft: 'auto' }}>{c.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 收藏对 */}
      {favorites.length > 0 && (
        <div className="exch-card exch-card-delay-2" style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Star size={14} style={{ color: '#f59e0b' }} />
            收藏货币对
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {favorites.map(pair => {
              const [from, to] = pair.split('-')
              const info = getCurrencyInfo(from)
              const targetInfo = getCurrencyInfo(to)
              return (
                <button
                  key={pair}
                  onClick={() => { setBaseCurrency(from); setTargetCurrency(to) }}
                  style={{
                    padding: '8px 14px', borderRadius: 20,
                    background: pair === `${baseCurrency}-${targetCurrency}` ? 'var(--accent-bg)' : 'var(--glass-bg)',
                    border: `1px solid ${pair === `${baseCurrency}-${targetCurrency}` ? 'var(--accent)' : 'var(--glass-border)'}`,
                    color: 'var(--text-primary)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6, fontSize: 13,
                  }}
                >
                  <span>{info.flag}</span>
                  <span>{from}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>→</span>
                  <span>{to}</span>
                  <span>{targetInfo.flag}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* 常用汇率 */}
      {Object.keys(rates).length > 0 && (
        <div className="exch-card exch-card-delay-3">
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Globe size={14} style={{ color: 'var(--accent)' }} />
            1 {baseCurrency} 兑换主流货币
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: 8,
          }}>
            {['USD', 'EUR', 'CNY', 'JPY', 'GBP', 'HKD', 'AUD', 'KRW'].filter(c => c !== baseCurrency).map(c => {
              const rate = rates[c]
              if (!rate) return null
              const info = getCurrencyInfo(c)
              return (
                <div
                  key={c}
                  style={{
                    padding: '12px',
                    borderRadius: 10,
                    background: 'var(--glass-bg)',
                    border: '1px solid var(--glass-border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: 18 }}>{info.flag}</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{c}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>
                      {rate.toFixed(rate < 1 ? 4 : 2)}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
})

export default ExchangeRate
