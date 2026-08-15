import { useState, useEffect, useCallback, useMemo } from 'react'
import { useStore } from '../store'
import {
  Hash,
  Copy,
  Check,
  History,
  Trash2,
  ChevronDown,
  Sparkles,
  Lightbulb,
} from 'lucide-react'

const STORAGE_KEY = 'number-base-converter-history'
const MAX_HISTORY = 20

const BASE_OPTIONS = [
  { base: 2, name: '二进制', label: 'BIN' },
  { base: 8, name: '八进制', label: 'OCT' },
  { base: 10, name: '十进制', label: 'DEC' },
  { base: 16, name: '十六进制', label: 'HEX' },
]

const DIGIT_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

interface ConversionStep {
  description: string
  detail: string
}

interface HistoryItem {
  input: string
  fromBase: number
  decimal: string
  timestamp: number
}

interface ConversionResult {
  binary: string
  octal: string
  decimal: string
  hex: string
  customBase: string
  steps: ConversionStep[]
  isFloat: boolean
}

function isValidDigit(char: string, base: number): boolean {
  const upper = char.toUpperCase()
  const digitVal = DIGIT_CHARS.indexOf(upper)
  return digitVal >= 0 && digitVal < base
}

function validateInput(value: string, base: number): { valid: boolean; error?: string } {
  if (!value.trim()) return { valid: false, error: '请输入数值' }

  let hasDot = false
  let startIndex = 0

  if (value.startsWith('-')) startIndex = 1

  for (let i = startIndex; i < value.length; i++) {
    const ch = value[i]
    if (ch === '.') {
      if (hasDot) return { valid: false, error: '小数点只能有一个' }
      hasDot = true
      if (i === startIndex) return { valid: false, error: '小数点前必须有数字' }
      continue
    }
    if (!isValidDigit(ch, base)) {
      return { valid: false, error: `包含非法字符 "${ch}"（${base}进制不支持）` }
    }
  }

  if (value === '-' || value === '.') return { valid: false, error: '请输入有效数值' }

  return { valid: true }
}

function parseToBigInt(value: string, base: number): { intPart: bigint; fracPart: string } | null {
  try {
    let negative = false
    let workingValue = value

    if (workingValue.startsWith('-')) {
      negative = true
      workingValue = workingValue.slice(1)
    }

    const dotIndex = workingValue.indexOf('.')
    const intPartStr = dotIndex >= 0 ? workingValue.slice(0, dotIndex) : workingValue
    const fracPartStr = dotIndex >= 0 ? workingValue.slice(dotIndex + 1) : ''

    if (!intPartStr) return null

    let intPart = 0n
    const baseBig = BigInt(base)
    for (const ch of intPartStr) {
      const digitVal = DIGIT_CHARS.indexOf(ch.toUpperCase())
      if (digitVal < 0 || digitVal >= base) return null
      intPart = intPart * baseBig + BigInt(digitVal)
    }

    if (negative) intPart = -intPart

    return { intPart, fracPart: fracPartStr }
  } catch {
    return null
  }
}

function bigIntToBase(value: bigint, base: number): string {
  if (value === 0n) return '0'
  const digits: string[] = []
  let negative = false
  let working = value

  if (working < 0n) {
    negative = true
    working = -working
  }

  const baseBig = BigInt(base)
  while (working > 0n) {
    const remainder = Number(working % baseBig)
    digits.unshift(DIGIT_CHARS[remainder])
    working = working / baseBig
  }

  return (negative ? '-' : '') + digits.join('')
}

function convertValue(input: string, fromBase: number, customBase: number): ConversionResult | null {
  const validation = validateInput(input, fromBase)
  if (!validation.valid) return null

  const parsed = parseToBigInt(input, fromBase)
  if (!parsed) return null

  const { intPart, fracPart } = parsed
  const isFloat = fracPart.length > 0

  const steps: ConversionStep[] = []
  const absIntPart = intPart < 0n ? -intPart : intPart
  const sign = intPart < 0n ? '-' : ''

  steps.push({
    description: '原数值',
    detail: `${input}（${fromBase}进制）`,
  })

  if (isFloat) {
    const fracDecStr = fracPart ? fracDecimalToBase10(fracPart, fromBase) : ''
    const decimalStr = intPart.toString() + (fracDecStr ? '.' + fracDecStr : '')

    steps.push({
      description: '整数部分 → 十进制',
      detail: `${sign}${absIntPart.toString()}（整数部分）`,
    })

    if (fracPart) {
      steps.push({
        description: '小数部分 → 十进制',
        detail: `0.${fracPart}（${fromBase}进制）→ ${fracDecimalToBase10(fracPart, fromBase)}（十进制）`,
      })
    }

    const binary = convertFloatBase(input, fromBase, 2)
    const octal = convertFloatBase(input, fromBase, 8)
    const decimal = decimalStr
    const hex = convertFloatBase(input, fromBase, 16)
    const custom = convertFloatBase(input, fromBase, customBase)

    steps.push({
      description: `→ ${customBase}进制`,
      detail: custom,
    })

    return {
      binary,
      octal,
      decimal,
      hex,
      customBase: custom,
      steps,
      isFloat: true,
    }
  }

  const decimalStr = intPart.toString()

  steps.push({
    description: '→ 十进制',
    detail: decimalStr,
  })

  const binary = bigIntToBase(intPart, 2)
  const octal = bigIntToBase(intPart, 8)
  const hex = bigIntToBase(intPart, 16)
  const custom = bigIntToBase(intPart, customBase)

  steps.push({
    description: `→ ${customBase}进制`,
    detail: custom,
  })

  return {
    binary,
    octal,
    decimal: decimalStr,
    hex,
    customBase: custom,
    steps,
    isFloat: false,
  }
}

function fracDecimalToBase10(fracStr: string, base: number): string {
  if (!fracStr) return ''
  let fracVal = 0n
  let multiplier = 1n
  const baseBig = BigInt(base)
  for (const ch of fracStr) {
    const digitVal = DIGIT_CHARS.indexOf(ch.toUpperCase())
    if (digitVal < 0 || digitVal >= base) return ''
    fracVal = fracVal * baseBig + BigInt(digitVal)
    multiplier *= baseBig
  }
  const result = Number(fracVal) / Number(multiplier)
  return result.toPrecision(15).replace(/\.?0+$/, '')
}

function convertFloatBase(input: string, fromBase: number, toBase: number): string {
  const validation = validateInput(input, fromBase)
  if (!validation.valid) return ''

  const parsed = parseToBigInt(input, fromBase)
  if (!parsed) return ''

  const { intPart, fracPart } = parsed
  const isFloat = fracPart.length > 0

  if (!isFloat) {
    return bigIntToBase(intPart, toBase)
  }

  const sign = intPart < 0n ? '-' : ''
  const absIntPart = intPart < 0n ? -intPart : intPart

  const intStr = bigIntToBase(absIntPart, toBase)

  let fracResult = ''
  if (fracPart) {
    fracResult = convertFraction(fracPart, fromBase, toBase)
  }

  return `${sign}${intStr}.${fracResult}`
}

function convertFraction(fracStr: string, fromBase: number, toBase: number): string {
  const decimalFrac = fracDecimalToBase10(fracStr, fromBase)
  if (!decimalFrac) return ''

  const decimalVal = parseFloat('0.' + decimalFrac)
  if (isNaN(decimalVal)) return ''

  const resultDigits: string[] = []
  let current = decimalVal
  const maxIter = 20

  for (let i = 0; i < maxIter && current > 0; i++) {
    current *= toBase
    const digit = Math.floor(current)
    resultDigits.push(DIGIT_CHARS[digit])
    current -= digit

    if (current < 1e-15) break
  }

  return resultDigits.join('')
}

export default function NumberBaseConverter() {
  const theme = useStore(s => s.theme)
  const isDark = theme === 'dark'

  const [input, setInput] = useState('255')
  const [fromBase, setFromBase] = useState(10)
  const [customBase, setCustomBase] = useState(36)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const [showSteps, setShowSteps] = useState(true)
  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setHistory(JSON.parse(saved))
    } catch {}
  }, [])

  const saveHistory = useCallback((item: HistoryItem) => {
    setHistory(prev => {
      const filtered = prev.filter(h => !(h.input === item.input && h.fromBase === item.fromBase))
      const next = [item, ...filtered].slice(0, MAX_HISTORY)
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {}
      return next
    })
  }, [])

  const clearHistory = useCallback(() => {
    setHistory([])
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {}
  }, [])

  const result = useMemo(() => {
    if (!input.trim()) {
      setError('')
      return null
    }
    const res = convertValue(input.trim(), fromBase, customBase)
    if (!res) {
      const validation = validateInput(input.trim(), fromBase)
      setError(validation.error || '转换失败')
      return null
    }
    setError('')
    return res
  }, [input, fromBase, customBase])

  useEffect(() => {
    if (result && input.trim()) {
      saveHistory({
        input: input.trim(),
        fromBase,
        decimal: result.decimal,
        timestamp: Date.now(),
      })
    }
  }, [result, input, fromBase, saveHistory])

  const copyValue = useCallback(async (value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(value)
      setTimeout(() => setCopied(null), 1500)
    } catch {}
  }, [])

  const handleBaseChange = (newBase: number) => {
    setFromBase(newBase)
  }

  const handleInputChange = (value: string) => {
    setInput(value)
  }

  const loadFromHistory = (item: HistoryItem) => {
    setInput(item.input)
    setFromBase(item.fromBase)
    setShowHistory(false)
  }

  const clearAll = () => {
    setInput('')
    setError('')
  }

  const themeColors = useMemo(() => ({
    cardBg: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
    border: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    hoverBg: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    inputBg: isDark ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.6)',
    errorBg: isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.1)',
    resultBg: isDark ? 'rgba(16,185,129,0.08)' : 'rgba(16,185,129,0.06)',
    stepBg: isDark ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.06)',
  }), [isDark])

  const baseNames: Record<number, string> = {
    2: '二进制',
    8: '八进制',
    10: '十进制',
    16: '十六进制',
  }

  return (
    <div style={{
      height: '100%',
      background: 'var(--window-bg)',
      color: 'var(--text-primary)',
      overflow: 'auto',
      padding: 16,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: 13,
    }}>
      <style>{`
        .nbc-card {
          background: var(--glass-bg, ${themeColors.cardBg});
          border: 1px solid var(--glass-border, ${themeColors.border});
          border-radius: var(--radius-md, 12px);
          padding: 14px;
        }
        .nbc-row { display: flex; align-items: center; gap: 8px; }
        .nbc-btn {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 6px 12px; border-radius: var(--radius-sm, 8px);
          background: var(--accent-bg);
          border: 1px solid transparent; color: var(--text-primary);
          cursor: pointer; font-size: 12px; font-family: inherit;
          transition: all 0.2s ease; font-weight: 500;
        }
        .nbc-btn:hover { background: var(--accent); color: #fff; transform: translateY(-1px); }
        .nbc-btn:active { transform: translateY(0); }
        .nbc-btn-sm { padding: 4px 8px; font-size: 11px; }
        .nbc-btn-active {
          background: var(--accent-gradient) !important;
          color: #fff !important;
          border-color: transparent !important;
        }
        .nbc-input {
          background: ${themeColors.inputBg};
          border: 1px solid ${themeColors.border};
          border-radius: var(--radius-sm, 8px);
          color: var(--text-primary);
          padding: 10px 12px;
          font-size: 14px;
          font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
          outline: none; transition: border-color 0.2s; width: 100%;
        }
        .nbc-input:focus { border-color: var(--accent); }
        .nbc-label {
          font-size: 11px; color: var(--text-secondary);
          text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;
        }
        .nbc-section-title {
          font-size: 12px; font-weight: 600; color: var(--accent);
          margin-bottom: 10px; display: flex; align-items: center; gap: 6px;
        }
        .nbc-result-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 12px; background: ${themeColors.inputBg};
          border-radius: var(--radius-sm, 8px);
          border: 1px solid ${themeColors.border};
          transition: all 0.2s ease;
        }
        .nbc-result-row:hover {
          background: ${themeColors.hoverBg};
          border-color: var(--accent);
        }
        .nbc-result-value {
          font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
          font-size: 15px; font-weight: 600; word-break: break-all;
          color: var(--text-primary); letter-spacing: 0.5px;
        }
        .nbc-copy-btn {
          background: transparent; border: none; cursor: pointer;
          padding: 4px; border-radius: 6px; color: var(--text-secondary);
          display: flex; align-items: center; justify-content: center;
          transition: all 0.15s;
        }
        .nbc-copy-btn:hover { background: var(--accent-bg); color: var(--accent); }
        .nbc-step {
          padding: 8px 12px; background: ${themeColors.stepBg};
          border-radius: var(--radius-sm, 8px); margin-bottom: 6px;
          border-left: 3px solid var(--accent);
        }
        .nbc-step-desc {
          font-size: 11px; color: var(--text-secondary); margin-bottom: 3px;
          display: flex; align-items: center; gap: 4px;
        }
        .nbc-step-detail {
          font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
          font-size: 13px; color: var(--text-primary); word-break: break-all;
        }
        .nbc-history-item {
          padding: 10px 12px; background: ${themeColors.inputBg};
          border-radius: var(--radius-sm, 8px); cursor: pointer;
          border: 1px solid ${themeColors.border};
          transition: all 0.2s ease;
        }
        .nbc-history-item:hover {
          background: ${themeColors.hoverBg};
          border-color: var(--accent);
          transform: translateX(3px);
        }
        .nbc-base-chip {
          display: inline-flex; align-items: center; justify-content: center;
          width: 32px; height: 32px; border-radius: 8px;
          background: ${themeColors.inputBg}; border: 1px solid ${themeColors.border};
          cursor: pointer; font-size: 11px; font-weight: 600;
          transition: all 0.2s ease; color: var(--text-secondary);
        }
        .nbc-base-chip:hover { border-color: var(--accent); color: var(--accent); }
        .nbc-base-chip-active {
          background: var(--accent-gradient); color: #fff !important;
          border-color: transparent !important;
        }
      `}</style>

      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        {/* Header */}
        <div className="nbc-row" style={{ marginBottom: 14, gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 12,
            background: 'var(--accent-gradient)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--accent-glow)',
          }}>
            <Hash size={18} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>进制转换器</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              支持 2-36 进制互转 · 整数 & 浮点数 · 大数
            </div>
          </div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="nbc-btn nbc-btn-sm"
          >
            <History size={12} /> 历史 ({history.length})
          </button>
        </div>

        {showHistory ? (
          <div className="nbc-card" style={{ marginBottom: 12 }}>
            <div className="nbc-row" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
              <div className="nbc-section-title" style={{ marginBottom: 0 }}>
                <History size={13} /> 历史记录
              </div>
              <div className="nbc-row">
                <button onClick={() => setShowHistory(false)} className="nbc-btn nbc-btn-sm">
                  ← 返回
                </button>
                {history.length > 0 && (
                  <button onClick={clearHistory} className="nbc-btn nbc-btn-sm" style={{ color: 'var(--error)' }}>
                    <Trash2 size={11} /> 清空
                  </button>
                )}
              </div>
            </div>
            {history.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: 30,
                color: 'var(--text-secondary)', fontSize: 13,
              }}>
                <History size={32} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.4 }} />
                暂无历史记录
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {history.map((item) => (
                  <div
                    key={item.timestamp}
                    className="nbc-history-item"
                    onClick={() => loadFromHistory(item)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{
                          fontFamily: 'SF Mono, monospace',
                          fontSize: 14, fontWeight: 600, marginBottom: 3,
                        }}>
                          {item.input}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                          {item.fromBase}进制 → {item.decimal}
                        </div>
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Input Section */}
            <div className="nbc-card" style={{ marginBottom: 12 }}>
              <div className="nbc-section-title">
                <Hash size={13} /> 输入数值
              </div>

              {/* Base Selector */}
              <div style={{ marginBottom: 10 }}>
                <div className="nbc-label" style={{ marginBottom: 6 }}>源进制</div>
                <div className="nbc-row" style={{ flexWrap: 'wrap', gap: 6 }}>
                  {BASE_OPTIONS.map(opt => (
                    <button
                      key={opt.base}
                      onClick={() => handleBaseChange(opt.base)}
                      className={`nbc-base-chip ${fromBase === opt.base ? 'nbc-base-chip-active' : ''}`}
                      title={opt.name}
                    >
                      {opt.label}
                    </button>
                  ))}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto',
                  }}>
                    <span className="nbc-label">自定义</span>
                    <select
                      value={fromBase}
                      onChange={(e) => handleBaseChange(Number(e.target.value))}
                      style={{
                        background: themeColors.inputBg,
                        color: 'var(--text-primary)',
                        border: `1px solid ${themeColors.border}`,
                        borderRadius: 'var(--radius-sm, 8px)',
                        padding: '4px 8px',
                        fontSize: 12,
                        outline: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      {Array.from({ length: 35 }, (_, i) => i + 2).map(b => (
                        <option key={b} value={b}>{b}进制</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Input Field */}
              <div className="nbc-row" style={{ gap: 8 }}>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => handleInputChange(e.target.value)}
                  placeholder={`输入${baseNames[fromBase] || fromBase + '进制'}数值...`}
                  className="nbc-input"
                  spellCheck={false}
                  autoCapitalize="characters"
                />
                {input && (
                  <button onClick={clearAll} className="nbc-btn nbc-btn-sm" title="清空">
                    <Trash2 size={12} />
                  </button>
                )}
              </div>

              {error && (
                <div style={{
                  marginTop: 8, padding: '8px 12px',
                  background: themeColors.errorBg,
                  borderRadius: 'var(--radius-sm, 8px)',
                  color: 'var(--error)', fontSize: 12,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  ⚠ {error}
                </div>
              )}

              {/* Quick Input Hints */}
              <div className="nbc-row" style={{ marginTop: 10, flexWrap: 'wrap', gap: 6 }}>
                <span className="nbc-label">示例:</span>
                {fromBase === 2 && (
                  <>
                    <button className="nbc-btn nbc-btn-sm" onClick={() => setInput('1010')}>1010</button>
                    <button className="nbc-btn nbc-btn-sm" onClick={() => setInput('11111111')}>11111111</button>
                    <button className="nbc-btn nbc-btn-sm" onClick={() => setInput('1010.101')}>1010.101</button>
                  </>
                )}
                {fromBase === 8 && (
                  <>
                    <button className="nbc-btn nbc-btn-sm" onClick={() => setInput('777')}>777</button>
                    <button className="nbc-btn nbc-btn-sm" onClick={() => setInput('01234567')}>01234567</button>
                  </>
                )}
                {fromBase === 10 && (
                  <>
                    <button className="nbc-btn nbc-btn-sm" onClick={() => setInput('255')}>255</button>
                    <button className="nbc-btn nbc-btn-sm" onClick={() => setInput('3.14159')}>3.14159</button>
                    <button className="nbc-btn nbc-btn-sm" onClick={() => setInput('999999999999999999')}>大数</button>
                  </>
                )}
                {fromBase === 16 && (
                  <>
                    <button className="nbc-btn nbc-btn-sm" onClick={() => setInput('FF')}>FF</button>
                    <button className="nbc-btn nbc-btn-sm" onClick={() => setInput('DEADBEEF')}>DEADBEEF</button>
                    <button className="nbc-btn nbc-btn-sm" onClick={() => setInput('A.BC')}>A.BC</button>
                  </>
                )}
                {![2, 8, 10, 16].includes(fromBase) && (
                  <button className="nbc-btn nbc-btn-sm" onClick={() => setInput('ZZZZ')}>ZZZZ</button>
                )}
              </div>
            </div>

            {/* Results Section */}
            {result && (
              <div className="nbc-card" style={{ marginBottom: 12 }}>
                <div className="nbc-section-title">
                  <Sparkles size={13} /> 转换结果
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    { label: '二进制', key: 'binary', value: result.binary, icon: '01' },
                    { label: '八进制', key: 'octal', value: result.octal, icon: '07' },
                    { label: '十进制', key: 'decimal', value: result.decimal, icon: '10' },
                    { label: '十六进制', key: 'hex', value: result.hex, icon: 'FF' },
                  ].map(({ label, value, icon }) => (
                    <div key={label} className="nbc-result-row">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 8,
                          background: 'var(--accent-bg)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 10, fontWeight: 700, color: 'var(--accent)',
                          flexShrink: 0,
                        }}>
                          {icon}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="nbc-label" style={{ marginBottom: 3 }}>{label}</div>
                          <div className="nbc-result-value">{value}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => copyValue(value)}
                        className="nbc-copy-btn"
                        title="复制"
                      >
                        {copied === value ? <Check size={14} style={{ color: 'var(--success)' }} /> : <Copy size={14} />}
                      </button>
                    </div>
                  ))}

                  {/* Custom Base Result */}
                  <div className="nbc-result-row" style={{ border: '1px dashed var(--accent)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: 'var(--accent-gradient)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, fontWeight: 700, color: '#fff',
                        flexShrink: 0,
                      }}>
                        {customBase}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="nbc-label" style={{ marginBottom: 3 }}>
                          自定义 ({customBase}进制)
                        </div>
                        <div className="nbc-result-value">{result.customBase}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => copyValue(result.customBase)}
                      className="nbc-copy-btn"
                      title="复制"
                    >
                      {copied === result.customBase ? <Check size={14} style={{ color: 'var(--success)' }} /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                {/* Custom Base Selector */}
                <div style={{ marginTop: 10 }}>
                  <div className="nbc-row" style={{ gap: 8 }}>
                    <span className="nbc-label">目标进制</span>
                    <select
                      value={customBase}
                      onChange={(e) => setCustomBase(Number(e.target.value))}
                      style={{
                        background: themeColors.inputBg,
                        color: 'var(--text-primary)',
                        border: `1px solid ${themeColors.border}`,
                        borderRadius: 'var(--radius-sm, 8px)',
                        padding: '4px 8px',
                        fontSize: 12,
                        outline: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      {Array.from({ length: 35 }, (_, i) => i + 2).map(b => (
                        <option key={b} value={b}>{b}进制</option>
                      ))}
                    </select>
                    {result.isFloat && (
                      <span style={{ fontSize: 11, color: 'var(--warning)' }}>
                        ⚠ 浮点精度可能有限
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Conversion Steps */}
            {result && (
              <div className="nbc-card" style={{ marginBottom: 12 }}>
                <div
                  className="nbc-row"
                  style={{ justifyContent: 'space-between', cursor: 'pointer', marginBottom: 10 }}
                  onClick={() => setShowSteps(!showSteps)}
                >
                  <div className="nbc-section-title" style={{ marginBottom: 0 }}>
                    <Lightbulb size={13} /> 转换步骤
                  </div>
                  <ChevronDown
                    size={14}
                    style={{
                      transform: showSteps ? 'rotate(180deg)' : 'rotate(0)',
                      transition: 'transform 0.2s',
                      color: 'var(--text-secondary)',
                    }}
                  />
                </div>
                {showSteps && (
                  <div>
                    {result.steps.map((step, idx) => (
                      <div key={idx} className="nbc-step">
                        <div className="nbc-step-desc">
                          <span style={{
                            background: 'var(--accent)',
                            color: '#fff',
                            borderRadius: '50%',
                            width: 16, height: 16,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 9,
                            fontWeight: 700,
                            flexShrink: 0,
                          }}>
                            {idx + 1}
                          </span>
                          {step.description}
                        </div>
                        <div className="nbc-step-detail">{step.detail}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tips */}
            <div style={{
              padding: '10px 14px',
              background: themeColors.stepBg,
              borderRadius: 'var(--radius-sm, 8px)',
              fontSize: 11,
              color: 'var(--text-secondary)',
              display: 'flex',
              gap: 8,
              alignItems: 'flex-start',
            }}>
              <Lightbulb size={13} style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>提示：</strong>
                支持 2-36 进制互转，使用 BigInt 处理大数。
                自定义进制中 36 进制使用 0-9 和 A-Z 全部字符。
                浮点数转换采用分步精度截断，可能存在微小误差。
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}