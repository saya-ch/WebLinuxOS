import { useState, useEffect, useCallback, useMemo } from 'react'
import { useStore } from '../store'

type UnitCategory = 'length' | 'weight' | 'temperature' | 'volume' | 'area' | 'time' | 'speed' | 'data' | 'currency'

interface UnitDef {
  key: string
  label: string
  toBase: number
  fromBase: number
}

interface CategoryDef {
  key: UnitCategory
  label: string
  icon: string
  units: UnitDef[]
}

const CATEGORIES: CategoryDef[] = [
  {
    key: 'length',
    label: '长度',
    icon: '📏',
    units: [
      { key: 'mm', label: '毫米 (mm)', toBase: 0.001, fromBase: 1000 },
      { key: 'cm', label: '厘米 (cm)', toBase: 0.01, fromBase: 100 },
      { key: 'm', label: '米 (m)', toBase: 1, fromBase: 1 },
      { key: 'km', label: '千米 (km)', toBase: 1000, fromBase: 0.001 },
      { key: 'inch', label: '英寸 (in)', toBase: 0.0254, fromBase: 39.3701 },
      { key: 'foot', label: '英尺 (ft)', toBase: 0.3048, fromBase: 3.28084 },
      { key: 'yard', label: '码 (yd)', toBase: 0.9144, fromBase: 1.09361 },
      { key: 'mile', label: '英里 (mi)', toBase: 1609.344, fromBase: 0.000621371 },
    ],
  },
  {
    key: 'weight',
    label: '重量',
    icon: '⚖️',
    units: [
      { key: 'mg', label: '毫克 (mg)', toBase: 0.000001, fromBase: 1000000 },
      { key: 'g', label: '克 (g)', toBase: 0.001, fromBase: 1000 },
      { key: 'kg', label: '千克 (kg)', toBase: 1, fromBase: 1 },
      { key: 'ton', label: '公吨 (t)', toBase: 1000, fromBase: 0.001 },
      { key: 'oz', label: '盎司 (oz)', toBase: 0.0283495, fromBase: 35.274 },
      { key: 'lb', label: '磅 (lb)', toBase: 0.453592, fromBase: 2.20462 },
    ],
  },
  {
    key: 'temperature',
    label: '温度',
    icon: '🌡️',
    units: [
      { key: 'C', label: '摄氏度 (°C)', toBase: 1, fromBase: 1 },
      { key: 'F', label: '华氏度 (°F)', toBase: 1, fromBase: 1 },
      { key: 'K', label: '开尔文 (K)', toBase: 1, fromBase: 1 },
    ],
  },
  {
    key: 'volume',
    label: '体积',
    icon: '🧪',
    units: [
      { key: 'ml', label: '毫升 (ml)', toBase: 0.001, fromBase: 1000 },
      { key: 'l', label: '升 (L)', toBase: 1, fromBase: 1 },
      { key: 'gallon', label: '加仑 (gal)', toBase: 3.78541, fromBase: 0.264172 },
      { key: 'cup', label: '杯 (cup)', toBase: 0.24, fromBase: 4.16667 },
      { key: 'fl oz', label: '液盎司 (fl oz)', toBase: 0.0295735, fromBase: 33.814 },
    ],
  },
  {
    key: 'area',
    label: '面积',
    icon: '🟦',
    units: [
      { key: 'mm2', label: '平方毫米 (mm²)', toBase: 0.000001, fromBase: 1000000 },
      { key: 'cm2', label: '平方厘米 (cm²)', toBase: 0.0001, fromBase: 10000 },
      { key: 'm2', label: '平方米 (m²)', toBase: 1, fromBase: 1 },
      { key: 'km2', label: '平方千米 (km²)', toBase: 1000000, fromBase: 0.000001 },
      { key: 'acre', label: '英亩 (ac)', toBase: 4046.86, fromBase: 0.000247105 },
      { key: 'ha', label: '公顷 (ha)', toBase: 10000, fromBase: 0.0001 },
    ],
  },
  {
    key: 'time',
    label: '时间',
    icon: '⏱️',
    units: [
      { key: 'ms', label: '毫秒 (ms)', toBase: 0.001, fromBase: 1000 },
      { key: 's', label: '秒 (s)', toBase: 1, fromBase: 1 },
      { key: 'min', label: '分钟 (min)', toBase: 60, fromBase: 0.0166667 },
      { key: 'hour', label: '小时 (hr)', toBase: 3600, fromBase: 0.000277778 },
      { key: 'day', label: '天 (d)', toBase: 86400, fromBase: 0.0000115741 },
      { key: 'week', label: '周 (wk)', toBase: 604800, fromBase: 0.00000165344 },
      { key: 'month', label: '月 (mo)', toBase: 2629800, fromBase: 0.000000380517 },
      { key: 'year', label: '年 (yr)', toBase: 31557600, fromBase: 0.0000000316881 },
    ],
  },
  {
    key: 'speed',
    label: '速度',
    icon: '🚀',
    units: [
      { key: 'mps', label: '米/秒 (m/s)', toBase: 1, fromBase: 1 },
      { key: 'kmh', label: '千米/时 (km/h)', toBase: 0.277778, fromBase: 3.6 },
      { key: 'mph', label: '英里/时 (mph)', toBase: 0.44704, fromBase: 2.23694 },
      { key: 'knot', label: '节 (kn)', toBase: 0.514444, fromBase: 1.94384 },
    ],
  },
  {
    key: 'data',
    label: '数据存储',
    icon: '💾',
    units: [
      { key: 'bit', label: '位 (bit)', toBase: 0.125, fromBase: 8 },
      { key: 'byte', label: '字节 (B)', toBase: 1, fromBase: 1 },
      { key: 'KB', label: '千字节 (KB)', toBase: 1024, fromBase: 0.000976563 },
      { key: 'MB', label: '兆字节 (MB)', toBase: 1048576, fromBase: 0.000000953674 },
      { key: 'GB', label: '吉字节 (GB)', toBase: 1073741824, fromBase: 0.000000000931323 },
      { key: 'TB', label: '太字节 (TB)', toBase: 1099511627776, fromBase: 0.000000000000909495 },
    ],
  },
  {
    key: 'currency',
    label: '货币',
    icon: '💱',
    units: [],
  },
]

const COMMON_CURRENCIES = [
  { code: 'USD', name: '美元', symbol: '$' },
  { code: 'EUR', name: '欧元', symbol: '€' },
  { code: 'GBP', name: '英镑', symbol: '£' },
  { code: 'JPY', name: '日元', symbol: '¥' },
  { code: 'CNY', name: '人民币', symbol: '¥' },
  { code: 'HKD', name: '港币', symbol: 'HK$' },
  { code: 'AUD', name: '澳元', symbol: 'A$' },
  { code: 'CAD', name: '加元', symbol: 'C$' },
  { code: 'CHF', name: '瑞郎', symbol: 'Fr' },
  { code: 'SGD', name: '新加坡元', symbol: 'S$' },
  { code: 'NZD', name: '新西兰元', symbol: 'NZ$' },
  { code: 'INR', name: '印度卢比', symbol: '₹' },
  { code: 'KRW', name: '韩元', symbol: '₩' },
  { code: 'RUB', name: '卢布', symbol: '₽' },
  { code: 'BRL', name: '雷亚尔', symbol: 'R$' },
  { code: 'ZAR', name: '兰特', symbol: 'R' },
]

const FALLBACK_RATES: Record<string, number> = {
  USD: 1, EUR: 0.92, GBP: 0.79, JPY: 155, CNY: 7.24, HKD: 7.81,
  AUD: 1.52, CAD: 1.36, CHF: 0.90, SGD: 1.35, NZD: 1.64, INR: 83.2,
  KRW: 1370, RUB: 92.5, BRL: 5.15, ZAR: 18.7,
}

const HISTORY_KEY = 'weblinux-unitconverter-history'
const MAX_HISTORY = 20

interface HistoryRecord {
  id: string
  category: UnitCategory
  fromUnit: string
  toUnit: string
  fromValue: string
  toValue: string
  timestamp: number
}

function convertTemperature(value: number, from: string, to: string): number {
  let celsius: number
  if (from === 'C') celsius = value
  else if (from === 'F') celsius = (value - 32) * (5 / 9)
  else if (from === 'K') celsius = value - 273.15
  else return value

  if (to === 'C') return celsius
  if (to === 'F') return celsius * (9 / 5) + 32
  if (to === 'K') return celsius + 273.15
  return value
}

function formatNumber(num: number): string {
  if (!isFinite(num)) return '∞'
  if (isNaN(num)) return '无效'
  if (Math.abs(num) > 1e15 || (Math.abs(num) < 1e-10 && num !== 0)) {
    return num.toExponential(6).replace(/\.?0+e/, 'e')
  }
  let formatted = String(parseFloat(num.toPrecision(10)))
  if (formatted.includes('.')) {
    formatted = formatted.replace(/\.?0+$/, '')
  }
  return formatted
}

interface ExchangeRates {
  rates: Record<string, number>
  base: string
  timestamp: number
}

export default function UnitConverter() {
  const theme = useStore(s => s.theme)
  const isDark = theme === 'dark'

  const [category, setCategory] = useState<UnitCategory>('length')
  const [fromUnit, setFromUnit] = useState('mm')
  const [toUnit, setToUnit] = useState('m')
  const [fromValue, setFromValue] = useState('1')
  const [result, setResult] = useState('')
  const [history, setHistory] = useState<HistoryRecord[]>([])

  const [currencyFrom, setCurrencyFrom] = useState('USD')
  const [currencyTo, setCurrencyTo] = useState('CNY')
  const [currencyAmount, setCurrencyAmount] = useState('1')
  const [currencyResult, setCurrencyResult] = useState('')
  const [exchangeData, setExchangeData] = useState<ExchangeRates | null>(null)
  const [exchangeLoading, setExchangeLoading] = useState(false)
  const [exchangeError, setExchangeError] = useState<string | null>(null)
  const [lastExchangeFetch, setLastExchangeFetch] = useState(0)

  const currentCategory = useMemo(
    () => CATEGORIES.find(c => c.key === category)!,
    [category]
  )

  useEffect(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY)
      if (saved) {
        setHistory(JSON.parse(saved))
      }
    } catch {}
  }, [])

  const saveHistory = useCallback((record: HistoryRecord) => {
    setHistory(prev => {
      const next = [record, ...prev.filter(r => r.id !== record.id)].slice(0, MAX_HISTORY)
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
      } catch {}
      return next
    })
  }, [])

  const clearHistory = useCallback(() => {
    setHistory([])
    try {
      localStorage.removeItem(HISTORY_KEY)
    } catch {}
  }, [])

  const doConvert = useCallback(() => {
    const val = parseFloat(fromValue)
    if (isNaN(val)) {
      setResult('')
      return
    }

    if (category === 'temperature') {
      const r = convertTemperature(val, fromUnit, toUnit)
      const formatted = formatNumber(r)
      setResult(formatted)
      if (formatted && formatted !== '无效') {
        saveHistory({
          id: `${category}-${fromValue}-${fromUnit}-${toUnit}-${Date.now()}`,
          category,
          fromUnit,
          toUnit,
          fromValue,
          toValue: formatted,
          timestamp: Date.now(),
        })
      }
      return
    }

    if (category === 'currency') {
      return
    }

    const units = currentCategory.units
    const fromDef = units.find(u => u.key === fromUnit)
    const toDef = units.find(u => u.key === toUnit)
    if (!fromDef || !toDef) return

    const baseValue = val * fromDef.toBase
    const converted = baseValue * toDef.fromBase
    const formatted = formatNumber(converted)
    setResult(formatted)

    if (formatted) {
      saveHistory({
        id: `${category}-${fromValue}-${fromUnit}-${toUnit}-${Date.now()}`,
        category,
        fromUnit,
        toUnit,
        fromValue,
        toValue: formatted,
        timestamp: Date.now(),
      })
    }
  }, [category, fromValue, fromUnit, toUnit, currentCategory, saveHistory])

  useEffect(() => {
    if (category !== 'currency') {
      doConvert()
    }
  }, [category, doConvert])

  useEffect(() => {
    if (category === 'currency') {
      fetchExchangeRates(currencyFrom)
    }
  }, [category])

  const fetchExchangeRates = useCallback(async (baseCurrency: string) => {
    const now = Date.now()
    if (exchangeData && exchangeData.base === baseCurrency && (now - lastExchangeFetch) < 60 * 60 * 1000) {
      return
    }
    setExchangeLoading(true)
    setExchangeError(null)
    try {
      const url = `https://open.er-api.com/v6/latest/${baseCurrency}`
      const response = await fetch(url)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      if (data.result !== 'success') throw new Error('API error')
      setExchangeData({
        rates: data.rates,
        base: data.base_code,
        timestamp: data.time_last_update_unix || Date.now() / 1000,
      })
      setLastExchangeFetch(now)
      try {
        localStorage.setItem('weblinux-rates-' + baseCurrency, JSON.stringify({
          rates: data.rates,
          base: data.base_code,
          timestamp: data.time_last_update_unix || Date.now() / 1000,
          fetchTime: now,
        }))
      } catch {}
    } catch {
      try {
        const cached = localStorage.getItem('weblinux-rates-' + baseCurrency)
        if (cached) {
          const parsed = JSON.parse(cached)
          setExchangeData(parsed)
          setLastExchangeFetch(parsed.fetchTime || Date.now())
          setExchangeError('使用缓存数据（网络不可用）')
        } else {
          setExchangeData({
            rates: FALLBACK_RATES,
            base: baseCurrency,
            timestamp: Math.floor(Date.now() / 1000),
          })
          setExchangeError('使用模拟汇率数据')
        }
      } catch {
        setExchangeError('无法获取汇率，请稍后再试')
      }
    } finally {
      setExchangeLoading(false)
    }
  }, [exchangeData, lastExchangeFetch])

  const calcCurrencyResult = useCallback(() => {
    if (!exchangeData) return ''
    const amt = parseFloat(currencyAmount) || 0
    if (currencyFrom === currencyTo) {
      return formatNumber(amt)
    }
    let rate: number
    if (exchangeData.base === currencyFrom) {
      rate = exchangeData.rates[currencyTo] || 1
    } else if (exchangeData.base === currencyTo) {
      rate = 1 / (exchangeData.rates[currencyFrom] || 1)
    } else {
      const fromBase = exchangeData.rates[currencyFrom] || 1
      const toBase = exchangeData.rates[currencyTo] || 1
      rate = toBase / fromBase
    }
    return formatNumber(amt * rate)
  }, [exchangeData, currencyAmount, currencyFrom, currencyTo])

  useEffect(() => {
    if (category === 'currency' && exchangeData) {
      const r = calcCurrencyResult()
      setCurrencyResult(r)
      if (r && r !== '无效') {
        saveHistory({
          id: `currency-${currencyAmount}-${currencyFrom}-${currencyTo}-${Date.now()}`,
          category: 'currency',
          fromUnit: currencyFrom,
          toUnit: currencyTo,
          fromValue: currencyAmount,
          toValue: r,
          timestamp: Date.now(),
        })
      }
    }
  }, [category, exchangeData, calcCurrencyResult, currencyAmount, currencyFrom, currencyTo, saveHistory])

  const handleSwap = useCallback(() => {
    if (category === 'currency') {
      const f = currencyFrom
      setCurrencyFrom(currencyTo)
      setCurrencyTo(f)
    } else {
      const f = fromUnit
      setFromUnit(toUnit)
      setToUnit(f)
      if (result) {
        setFromValue(result)
      }
    }
  }, [category, currencyFrom, currencyTo, fromUnit, toUnit, result])

  const handleCategoryChange = useCallback((key: UnitCategory) => {
    setCategory(key)
    const cat = CATEGORIES.find(c => c.key === key)
    if (cat && cat.units.length >= 2) {
      setFromUnit(cat.units[0].key)
      setToUnit(cat.units[1].key)
    }
    setFromValue('1')
    setResult('')
    setCurrencyAmount('1')
    setCurrencyResult('')
  }, [])

  const themeColors = useMemo(() => ({
    surface: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
    border: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    hover: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    shadow: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.15)',
    displayBg: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.02)',
    activeBg: isDark ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.15)',
  }), [isDark])

  const isCurrency = category === 'currency'
  const activeUnits = currentCategory.units

  return (
    <div style={{
      background: 'var(--window-bg)',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex',
        gap: 4,
        padding: '10px 12px',
        overflowX: 'auto',
        borderBottom: `1px solid ${themeColors.border}`,
        flexShrink: 0,
      }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat.key}
            onClick={() => handleCategoryChange(cat.key)}
            style={{
              padding: '6px 12px',
              fontSize: 12,
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
              background: category === cat.key ? 'var(--accent-gradient)' : 'var(--color-surface)',
              color: category === cat.key ? '#fff' : 'var(--text-secondary)',
              fontWeight: category === cat.key ? 600 : 400,
            }}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      <div style={{
        flex: 1,
        padding: 12,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}>
        <div style={{
          background: themeColors.displayBg,
          borderRadius: 'var(--radius-lg)',
          padding: 14,
          border: `1px solid ${themeColors.border}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <label style={{ color: 'var(--text-secondary)', fontSize: 12, flex: 1 }}>从</label>
            {isCurrency ? (
              <select
                value={currencyFrom}
                onChange={(e) => {
                  const v = e.target.value
                  setCurrencyFrom(v)
                  fetchExchangeRates(v)
                }}
                style={{
                  background: 'var(--window-bg)',
                  color: 'var(--text-primary)',
                  border: `1px solid ${themeColors.border}`,
                  borderRadius: 'var(--radius-sm)',
                  padding: '4px 8px',
                  fontSize: 13,
                  outline: 'none',
                }}
              >
                {COMMON_CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>
                ))}
              </select>
            ) : (
              <select
                value={fromUnit}
                onChange={(e) => setFromUnit(e.target.value)}
                style={{
                  background: 'var(--window-bg)',
                  color: 'var(--text-primary)',
                  border: `1px solid ${themeColors.border}`,
                  borderRadius: 'var(--radius-sm)',
                  padding: '4px 8px',
                  fontSize: 13,
                  outline: 'none',
                }}
              >
                {activeUnits.map(u => (
                  <option key={u.key} value={u.key}>{u.label}</option>
                ))}
              </select>
            )}
          </div>
          <input
            type="number"
            value={isCurrency ? currencyAmount : fromValue}
            onChange={(e) => {
              if (isCurrency) {
                setCurrencyAmount(e.target.value)
              } else {
                setFromValue(e.target.value)
              }
            }}
            placeholder="输入数值"
            style={{
              width: '100%',
              background: 'transparent',
              color: 'var(--text-primary)',
              border: 'none',
              borderBottom: `2px solid ${themeColors.border}`,
              fontSize: 28,
              fontWeight: 300,
              textAlign: 'right',
              outline: 'none',
              padding: '6px 0',
              letterSpacing: '-0.5px',
            }}
          />
        </div>

        <div style={{ textAlign: 'center' }}>
          <button
            onClick={handleSwap}
            style={{
              background: 'var(--accent-gradient)',
              border: 'none',
              color: '#fff',
              padding: '8px 20px',
              borderRadius: 'var(--radius-md)',
              fontSize: 14,
              cursor: 'pointer',
              boxShadow: `0 2px 8px ${themeColors.shadow}`,
              transition: 'all 0.2s ease',
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            ⇅ 交换
          </button>
        </div>

        <div style={{
          background: themeColors.displayBg,
          borderRadius: 'var(--radius-lg)',
          padding: 14,
          border: `1px solid ${themeColors.border}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <label style={{ color: 'var(--text-secondary)', fontSize: 12, flex: 1 }}>到</label>
            {isCurrency ? (
              <select
                value={currencyTo}
                onChange={(e) => setCurrencyTo(e.target.value)}
                style={{
                  background: 'var(--window-bg)',
                  color: 'var(--text-primary)',
                  border: `1px solid ${themeColors.border}`,
                  borderRadius: 'var(--radius-sm)',
                  padding: '4px 8px',
                  fontSize: 13,
                  outline: 'none',
                }}
              >
                {COMMON_CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>
                ))}
              </select>
            ) : (
              <select
                value={toUnit}
                onChange={(e) => setToUnit(e.target.value)}
                style={{
                  background: 'var(--window-bg)',
                  color: 'var(--text-primary)',
                  border: `1px solid ${themeColors.border}`,
                  borderRadius: 'var(--radius-sm)',
                  padding: '4px 8px',
                  fontSize: 13,
                  outline: 'none',
                }}
              >
                {activeUnits.map(u => (
                  <option key={u.key} value={u.key}>{u.label}</option>
                ))}
              </select>
            )}
          </div>
          <div style={{
            fontSize: 28,
            fontWeight: 300,
            textAlign: 'right',
            padding: '6px 0',
            color: 'var(--text-primary)',
            letterSpacing: '-0.5px',
            wordBreak: 'break-all',
          }}>
            {isCurrency ? (
              exchangeLoading ? '加载中...' : currencyResult || '—'
            ) : (
              result || '—'
            )}
          </div>
        </div>

        {isCurrency && exchangeError && (
          <div style={{
            background: isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.1)',
            color: 'var(--error)',
            padding: '8px 12px',
            borderRadius: 'var(--radius-md)',
            fontSize: 12,
            textAlign: 'center',
          }}>
            {exchangeError}
          </div>
        )}

        {isCurrency && exchangeData && !exchangeLoading && (
          <div style={{
            background: themeColors.surface,
            color: 'var(--text-secondary)',
            padding: '8px 12px',
            borderRadius: 'var(--radius-md)',
            fontSize: 11,
            textAlign: 'center',
            border: `1px solid ${themeColors.border}`,
          }}>
            基准货币：{exchangeData.base} · 更新于 {new Date(exchangeData.timestamp * 1000).toLocaleString()}
          </div>
        )}

        {isCurrency && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => fetchExchangeRates(currencyFrom)}
              style={{
                flex: 1,
                padding: '8px 12px',
                background: 'var(--accent-bg)',
                color: 'var(--accent)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              🔄 刷新汇率
            </button>
          </div>
        )}

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 4,
          marginBottom: 4,
        }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
            📋 历史记录 ({history.length})
          </span>
          {history.length > 0 && (
            <button
              onClick={clearHistory}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--error)',
                fontSize: 12,
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: 'var(--radius-sm)',
                transition: 'all 0.2s ease',
              }}
            >
              清空
            </button>
          )}
        </div>

        <div style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}>
          {history.length === 0 ? (
            <div style={{
              color: 'var(--text-secondary)',
              textAlign: 'center',
              padding: 24,
              fontSize: 13,
              opacity: 0.6,
            }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📝</div>
              暂无历史记录
            </div>
          ) : (
            history.map((record) => (
              <div
                key={record.id}
                style={{
                  background: themeColors.surface,
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${themeColors.border}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontSize: 13,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = themeColors.hover
                  e.currentTarget.style.transform = 'translateX(3px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = themeColors.surface
                  e.currentTarget.style.transform = 'translateX(0)'
                }}
                onClick={() => {
                  setCategory(record.category)
                  if (record.category === 'currency') {
                    setCurrencyFrom(record.fromUnit)
                    setCurrencyTo(record.toUnit)
                    setCurrencyAmount(record.fromValue)
                  } else {
                    const cat = CATEGORIES.find(c => c.key === record.category)
                    if (cat) {
                      setFromUnit(record.fromUnit)
                      setToUnit(record.toUnit)
                      setFromValue(record.fromValue)
                    }
                  }
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                    {record.fromValue} {record.fromUnit} = {record.toValue} {record.toUnit}
                  </span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: 11, flexShrink: 0, marginLeft: 8 }}>
                    {new Date(record.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}