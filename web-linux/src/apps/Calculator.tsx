import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { useStore } from '../store'

// 交互式按钮组件 - 增强视觉反馈
const InteractiveButton = ({ style, children, onClick, disabled = false, dataKey }: {
  style: React.CSSProperties,
  children: React.ReactNode,
  onClick?: () => void,
  disabled?: boolean,
  dataKey?: string
}) => {
  const [isPressed, setIsPressed] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isActive, setIsActive] = useState(false)

  const getButtonStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = { ...style, position: 'relative' as const }

    if (isHovered && !disabled) {
      baseStyle.transform = 'translateY(-2px)'
      baseStyle.boxShadow = '0 4px 12px rgba(0,0,0,0.3)'
      baseStyle.filter = 'brightness(1.1)'
    }

    if (isPressed || isActive) {
      baseStyle.transform = 'translateY(1px)'
      baseStyle.boxShadow = '0 1px 4px rgba(0,0,0,0.2)'
      baseStyle.filter = 'brightness(0.9)'
    }

    return baseStyle
  }

  // 监听键盘按下高亮
  useEffect(() => {
    if (!dataKey) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === dataKey) setIsActive(true)
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === dataKey) setIsActive(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [dataKey])

  return (
    <button
      style={getButtonStyle()}
      onClick={onClick}
      disabled={disabled}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => {
        setIsPressed(false)
        setIsHovered(false)
      }}
      onMouseEnter={() => setIsHovered(true)}
    >
      {children}
    </button>
  )
}

type Token = { type: 'number' | 'operator' | 'paren', value: string }

// 历史记录类型
interface HistoryItem {
  expression: string
  result: string
}

// 汇率相关类型
interface ExchangeRates {
  rates: Record<string, number>
  base: string
  timestamp: number
}

// 常用货币列表
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

// 格式化数字结果
const formatResult = (num: number): string => {
  if (!isFinite(num)) throw new Error('溢出错误')
  if (isNaN(num)) throw new Error('无效结果')
  // 超大/超小数用科学计数法
  if (Math.abs(num) > 1e15 || (Math.abs(num) < 1e-10 && num !== 0)) {
    return num.toExponential(8).replace(/\.?0+e/, 'e')
  }
  let formatted = String(parseFloat(num.toPrecision(12)))
  if (formatted.includes('.')) {
    formatted = formatted.replace(/\.?0+$/, '')
  }
  return formatted
}

export default function Calculator() {
  const theme = useStore(s => s.theme)
  const [display, setDisplay] = useState('0')
  const [expression, setExpression] = useState('')
  const [resetFlag, setResetFlag] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [angleMode, setAngleMode] = useState<'rad' | 'deg'>('rad')
  // 模式和汇率状态
  const [mode, setMode] = useState<'calc' | 'exchange'>('calc')
  const [exchangeData, setExchangeData] = useState<ExchangeRates | null>(null)
  const [exchangeLoading, setExchangeLoading] = useState(false)
  const [exchangeError, setExchangeError] = useState<string | null>(null)
  const [exchangeFrom, setExchangeFrom] = useState('USD')
  const [exchangeTo, setExchangeTo] = useState('CNY')
  const [exchangeAmount, setExchangeAmount] = useState('1')
  const [lastExchangeFetch, setLastExchangeFetch] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // 角度和弧度转换辅助函数
  const toRad = useCallback((x: number): number => {
    return angleMode === 'deg' ? (x * Math.PI) / 180 : x
  }, [angleMode])

  const safeCalculate = useCallback((expr: string): number => {
    try {
      const sanitized = expr
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/π/g, String(Math.PI))
        .replace(/e(?![xp])/g, String(Math.E))

      const tokens: Token[] = []
      let current = ''

      for (let i = 0; i < sanitized.length; i++) {
        const char = sanitized[i]
        if (char.match(/[0-9.]/)) {
          current += char
        } else if (char.match(/[+\-*/()]/)) {
          if (current) {
            tokens.push({ type: 'number', value: current })
            current = ''
          }
          if (char === '*' && sanitized[i + 1] === '*') {
            tokens.push({ type: 'operator', value: '**' })
            i++
          } else {
            tokens.push({ type: char === '(' || char === ')' ? 'paren' : 'operator', value: char })
          }
        }
      }
      if (current) {
        tokens.push({ type: 'number', value: current })
      }

      const applyOperator = (a: number, b: number, op: string): number => {
        switch (op) {
          case '+': return a + b
          case '-': return a - b
          case '*': return a * b
          case '/':
            if (b === 0) throw new Error('除零错误')
            return a / b
          case '**': {
            const result = Math.pow(a, b)
            if (!isFinite(result)) throw new Error('溢出错误')
            return result
          }
          default: throw new Error('未知操作符')
        }
      }

      const precedence = (op: string): number => {
        if (op === '**') return 3
        if (op === '*' || op === '/') return 2
        if (op === '+' || op === '-') return 1
        return 0
      }

      const output: (number | string)[] = []
      const operators: string[] = []

      for (const token of tokens) {
        if (token.type === 'number') {
          output.push(parseFloat(token.value))
        } else if (token.type === 'operator') {
          while (
            operators.length > 0 &&
            operators[operators.length - 1] !== '(' &&
            precedence(operators[operators.length - 1]) >= precedence(token.value)
          ) {
            output.push(operators.pop()!)
          }
          operators.push(token.value)
        } else if (token.type === 'paren') {
          if (token.value === '(') {
            operators.push(token.value)
          } else if (token.value === ')') {
            while (operators.length > 0 && operators[operators.length - 1] !== '(') {
              output.push(operators.pop()!)
            }
            operators.pop()
          }
        }
      }

      while (operators.length > 0) {
        output.push(operators.pop()!)
      }

      const stack: number[] = []
      for (const item of output) {
        if (typeof item === 'number') {
          stack.push(item)
        } else {
          const b = stack.pop()
          const a = stack.pop()
          if (a === undefined || b === undefined) throw new Error('表达式错误')
          const result = applyOperator(a, b, item)
          if (!isFinite(result)) throw new Error('溢出错误')
          stack.push(result)
        }
      }

      if (stack.length !== 1) throw new Error('计算错误')
      return stack[0]
    } catch (e) {
      if (e instanceof Error) throw e
      throw new Error('计算错误')
    }
  }, [])

  const handleNumber = useCallback((num: string) => {
    if (resetFlag) {
      setDisplay(num)
      setResetFlag(false)
    } else {
      setDisplay((prev) => (prev === '0' || prev === 'Error' ? num : prev + num))
    }
  }, [resetFlag])

  const handleOperator = useCallback((op: string) => {
    if (display === 'Error') return
    setExpression((prev) => prev + display + op)
    setResetFlag(true)
  }, [display])

  const handleDecimal = useCallback(() => {
    if (resetFlag || display === 'Error') {
      setDisplay('0.')
      setResetFlag(false)
    } else if (!display.includes('.')) {
      setDisplay((prev) => prev + '.')
    }
  }, [resetFlag, display])

  const handleClear = useCallback(() => {
    setDisplay('0')
    setExpression('')
    setResetFlag(false)
  }, [])

  const handleEqual = useCallback(() => {
    if (display === 'Error') {
      handleClear()
      return
    }

    try {
      const fullExp = expression + display
      if (!fullExp || fullExp === display && !expression) {
        // 无操作时直接返回
        return
      }
      const evalResult = safeCalculate(fullExp)

      const formatted = formatResult(evalResult)

      // 保存到历史记录
      setHistory((prev) => [{
        expression: fullExp,
        result: formatted
      }, ...prev.slice(0, 19)])

      setDisplay(formatted)
      setExpression('')
      setResetFlag(true)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error'
      setDisplay(msg === '计算错误' || msg === '表达式错误' ? 'Error' : msg)
      setExpression('')
      setResetFlag(true)
    }
  }, [expression, display, safeCalculate, handleClear])

  const handleClearEntry = useCallback(() => {
    setDisplay('0')
    setResetFlag(false)
  }, [])

  const handleBackspace = useCallback(() => {
    setDisplay((prev) => {
      if (prev === 'Error' || prev === '除零错误' || prev === '溢出错误') return '0'
      return (prev.length <= 1 || (prev.length === 2 && prev.startsWith('-'))) ? '0' : prev.slice(0, -1)
    })
  }, [])

  const handlePercent = useCallback(() => {
    if (display === 'Error') return
    try {
      const val = parseFloat(display) / 100
      setDisplay(formatResult(val))
      setResetFlag(true)
    } catch {
      setDisplay('Error')
    }
  }, [display])

  const handleSign = useCallback(() => {
    if (display !== '0' && display !== 'Error') {
      setDisplay((prev) => (prev.startsWith('-') ? prev.slice(1) : '-' + prev))
    }
  }, [display])

  const handleUnary = useCallback((fn: (x: number) => number) => {
    if (display === 'Error') return
    try {
      const val = parseFloat(display)
      const result = fn(val)
      setDisplay(formatResult(result))
      setResetFlag(true)
    } catch (e) {
      setDisplay(e instanceof Error ? e.message : 'Error')
    }
  }, [display])

  const handleConstant = useCallback((value: string) => {
    if (resetFlag || display === 'Error') {
      setDisplay(value)
      setResetFlag(false)
    } else if (display === '0') {
      setDisplay(value)
    }
  }, [resetFlag, display])

  const handleOpenParen = useCallback(() => {
    if (resetFlag || display === 'Error') {
      setExpression((prev) => prev + '(')
      setDisplay('0')
      setResetFlag(false)
    } else if (display === '0') {
      setExpression((prev) => prev + '(')
    } else {
      setExpression((prev) => prev + display + '(')
      setResetFlag(true)
    }
  }, [resetFlag, display])

  const handleCloseParen = useCallback(() => {
    if (display !== 'Error') {
      setExpression((prev) => prev + display + ')')
      setResetFlag(true)
    }
  }, [display])

  // 更多数学函数
  const handleFactorial = useCallback(() => {
    if (display === 'Error') return
    try {
      const n = parseInt(display)
      if (n < 0 || !Number.isInteger(parseFloat(display))) {
        setDisplay('Error')
        return
      }
      if (n > 170) {
        setDisplay('溢出错误')
        return
      }
      let result = 1
      for (let i = 2; i <= n; i++) {
        result *= i
      }
      setDisplay(String(result))
      setResetFlag(true)
    } catch {
      setDisplay('Error')
    }
  }, [display])

  const handleCubeRoot = useCallback(() => {
    if (display === 'Error') return
    try {
      const val = Math.cbrt(parseFloat(display))
      setDisplay(formatResult(val))
      setResetFlag(true)
    } catch {
      setDisplay('Error')
    }
  }, [display])

  const handleTan = useCallback(() => {
    if (display === 'Error') return
    try {
      const rad = toRad(parseFloat(display))
      // 检查 tan 的奇点 (π/2 + nπ)
      const cosVal = Math.cos(rad)
      if (Math.abs(cosVal) < 1e-10) throw new Error('未定义')
      const val = Math.tan(rad)
      setDisplay(formatResult(val))
      setResetFlag(true)
    } catch (e) {
      setDisplay(e instanceof Error ? e.message : 'Error')
    }
  }, [display, toRad])

  const handleAsin = useCallback(() => {
    if (display === 'Error') return
    try {
      const val = parseFloat(display)
      if (val < -1 || val > 1) throw new Error('未定义')
      const result = Math.asin(val)
      setDisplay(formatResult(angleMode === 'deg' ? (result * 180) / Math.PI : result))
      setResetFlag(true)
    } catch (e) {
      setDisplay(e instanceof Error ? e.message : 'Error')
    }
  }, [display, angleMode])

  const handleAcos = useCallback(() => {
    if (display === 'Error') return
    try {
      const val = parseFloat(display)
      if (val < -1 || val > 1) throw new Error('未定义')
      const result = Math.acos(val)
      setDisplay(formatResult(angleMode === 'deg' ? (result * 180) / Math.PI : result))
      setResetFlag(true)
    } catch (e) {
      setDisplay(e instanceof Error ? e.message : 'Error')
    }
  }, [display, angleMode])

  const handleAtan = useCallback(() => {
    if (display === 'Error') return
    try {
      const val = Math.atan(parseFloat(display))
      setDisplay(formatResult(angleMode === 'deg' ? (val * 180) / Math.PI : val))
      setResetFlag(true)
    } catch {
      setDisplay('Error')
    }
  }, [display, angleMode])

  const handleFloor = useCallback(() => {
    if (display === 'Error') return
    try {
      setDisplay(String(Math.floor(parseFloat(display))))
      setResetFlag(true)
    } catch {
      setDisplay('Error')
    }
  }, [display])

  const handleCeil = useCallback(() => {
    if (display === 'Error') return
    try {
      setDisplay(String(Math.ceil(parseFloat(display))))
      setResetFlag(true)
    } catch {
      setDisplay('Error')
    }
  }, [display])

  const handleRound = useCallback(() => {
    if (display === 'Error') return
    try {
      setDisplay(String(Math.round(parseFloat(display))))
      setResetFlag(true)
    } catch {
      setDisplay('Error')
    }
  }, [display])

  const handleExp = useCallback(() => {
    if (display === 'Error') return
    try {
      const val = Math.exp(parseFloat(display))
      setDisplay(formatResult(val))
      setResetFlag(true)
    } catch {
      setDisplay('溢出错误')
    }
  }, [display])

  const handle10x = useCallback(() => {
    if (display === 'Error') return
    try {
      const val = Math.pow(10, parseFloat(display))
      setDisplay(formatResult(val))
      setResetFlag(true)
    } catch {
      setDisplay('溢出错误')
    }
  }, [display])

  const handleReciprocal = useCallback(() => {
    if (display === 'Error') return
    try {
      const val = parseFloat(display)
      if (val === 0) throw new Error('除零错误')
      setDisplay(formatResult(1 / val))
      setResetFlag(true)
    } catch (e) {
      setDisplay(e instanceof Error ? e.message : 'Error')
    }
  }, [display])

  const handleAbs = useCallback(() => {
    if (display === 'Error') return
    try {
      const val = Math.abs(parseFloat(display))
      setDisplay(String(val))
      setResetFlag(true)
    } catch {
      setDisplay('Error')
    }
  }, [display])

  const handleSinh = useCallback(() => {
    if (display === 'Error') return
    try {
      const val = Math.sinh(parseFloat(display))
      setDisplay(formatResult(val))
      setResetFlag(true)
    } catch {
      setDisplay('Error')
    }
  }, [display])

  const handleCosh = useCallback(() => {
    if (display === 'Error') return
    try {
      const val = Math.cosh(parseFloat(display))
      setDisplay(formatResult(val))
      setResetFlag(true)
    } catch {
      setDisplay('Error')
    }
  }, [display])

  // 编程计算器
  const handleBinary = useCallback(() => {
    if (display === 'Error') return
    try {
      const val = parseInt(display)
      if (val < 0) throw new Error()
      setDisplay(val.toString(2).toUpperCase())
      setResetFlag(true)
    } catch {
      setDisplay('Error')
    }
  }, [display])

  const handleOctal = useCallback(() => {
    if (display === 'Error') return
    try {
      const val = parseInt(display)
      if (val < 0) throw new Error()
      setDisplay(val.toString(8).toUpperCase())
      setResetFlag(true)
    } catch {
      setDisplay('Error')
    }
  }, [display])

  const handleHex = useCallback(() => {
    if (display === 'Error') return
    try {
      const val = parseInt(display)
      if (val < 0) throw new Error()
      setDisplay('0x' + val.toString(16).toUpperCase())
      setResetFlag(true)
    } catch {
      setDisplay('Error')
    }
  }, [display])

  const handleDegrees = useCallback(() => {
    if (display === 'Error') return
    try {
      const rad = parseFloat(display)
      const deg = (rad * 180) / Math.PI
      setDisplay(String(Math.round(deg * 100) / 100))
      setResetFlag(true)
    } catch {
      setDisplay('Error')
    }
  }, [display])

  const handleRadians = useCallback(() => {
    if (display === 'Error') return
    try {
      const deg = parseFloat(display)
      const rad = (deg * Math.PI) / 180
      setDisplay(String(Math.round(rad * 100) / 100))
      setResetFlag(true)
    } catch {
      setDisplay('Error')
    }
  }, [display])

  const handleFromBase = useCallback((base: number) => {
    if (display === 'Error') return
    try {
      const val = parseInt(display, base)
      if (isNaN(val)) throw new Error()
      setDisplay(String(val))
      setResetFlag(true)
    } catch {
      setDisplay('Error')
    }
  }, [display])

  // 记忆功能
  const [memory, setMemory] = useState<number>(0)

  const handleMemoryAdd = useCallback(() => {
    if (display === 'Error') return
    const val = parseFloat(display)
    if (!isNaN(val)) {
      setMemory(prev => prev + val)
    }
  }, [display])

  const handleMemorySubtract = useCallback(() => {
    if (display === 'Error') return
    const val = parseFloat(display)
    if (!isNaN(val)) {
      setMemory(prev => prev - val)
    }
  }, [display])

  const handleMemoryRecall = useCallback(() => {
    setDisplay(String(memory))
    setResetFlag(true)
  }, [memory])

  const handleMemoryClear = useCallback(() => {
    setMemory(0)
  }, [])

  const handleYx = useCallback(() => {
    setExpression((prev) => prev + (display !== 'Error' ? display : '') + '^(1/')
    setResetFlag(true)
  }, [display])

  const handle10pow = useCallback(() => {
    if (display === 'Error') return
    try {
      const result = Math.pow(10, parseFloat(display))
      setDisplay(formatResult(result))
      setResetFlag(true)
    } catch {
      setDisplay('Error')
    }
  }, [display])

  const handleTanH = useCallback(() => {
    if (display === 'Error') return
    try {
      const val = Math.tanh(parseFloat(display))
      setDisplay(formatResult(val))
      setResetFlag(true)
    } catch {
      setDisplay('Error')
    }
  }, [display])

  const handleMod = useCallback(() => {
    setExpression((prev) => prev + (display !== 'Error' ? display : '') + '%')
    setResetFlag(true)
  }, [display])

  const handleLog2 = useCallback(() => {
    if (display === 'Error') return
    try {
      const val = Math.log2(parseFloat(display))
      setDisplay(formatResult(val))
      setResetFlag(true)
    } catch {
      setDisplay('Error')
    }
  }, [display])

  const handleLog1p = useCallback(() => {
    if (display === 'Error') return
    try {
      const val = Math.log1p(parseFloat(display))
      setDisplay(formatResult(val))
      setResetFlag(true)
    } catch {
      setDisplay('Error')
    }
  }, [display])

  const handleExpm1 = useCallback(() => {
    if (display === 'Error') return
    try {
      const val = Math.expm1(parseFloat(display))
      setDisplay(formatResult(val))
      setResetFlag(true)
    } catch {
      setDisplay('Error')
    }
  }, [display])

  const handleSignMemory = useCallback(() => {
    if (memory !== 0) {
      setDisplay(String(memory))
      setResetFlag(true)
    }
  }, [memory])

  const clearHistory = useCallback(() => {
    setHistory([])
  }, [])

  const handleFromHistory = useCallback((item: HistoryItem) => {
    setDisplay(item.result)
    setExpression(item.expression)
    setShowHistory(false)
    setResetFlag(true)
  }, [])

  // 键盘支持
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 避免在输入框中触发
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return
      if (mode !== 'calc') return

      const key = e.key

      // 数字键
      if (/^[0-9]$/.test(key)) {
        e.preventDefault()
        handleNumber(key)
        return
      }

      switch (key) {
        case '.':
          e.preventDefault()
          handleDecimal()
          break
        case '+':
          e.preventDefault()
          handleOperator('+')
          break
        case '-':
          e.preventDefault()
          handleOperator('-')
          break
        case '*':
          e.preventDefault()
          handleOperator('×')
          break
        case '/':
          e.preventDefault()
          handleOperator('÷')
          break
        case 'Enter':
        case '=':
          e.preventDefault()
          handleEqual()
          break
        case 'Escape':
          e.preventDefault()
          handleClear()
          break
        case 'Backspace':
          e.preventDefault()
          handleBackspace()
          break
        case '%':
          e.preventDefault()
          handlePercent()
          break
        case '(':
          e.preventDefault()
          handleOpenParen()
          break
        case ')':
          e.preventDefault()
          handleCloseParen()
          break
        case '^':
          e.preventDefault()
          handleOperator('**')
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mode, handleNumber, handleDecimal, handleOperator, handleEqual, handleClear, handleBackspace, handlePercent, handleOpenParen, handleCloseParen])

  // 从 API 获取汇率
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
      } catch { /* ignore */ }
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
            rates: {
              USD: 1, EUR: 0.92, GBP: 0.79, JPY: 155, CNY: 7.24, HKD: 7.81,
              AUD: 1.52, CAD: 1.36, CHF: 0.90, SGD: 1.35, NZD: 1.64, INR: 83.2,
              KRW: 1370, RUB: 92.5, BRL: 5.15, ZAR: 18.7,
            },
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

  const getExchangeResult = useCallback((): string => {
    if (!exchangeData) return '—'
    const amt = parseFloat(exchangeAmount) || 0
    if (exchangeFrom === exchangeTo) {
      return amt.toLocaleString(undefined, { maximumFractionDigits: 4 })
    }
    let rate: number
    if (exchangeData.base === exchangeFrom) {
      rate = exchangeData.rates[exchangeTo] || 1
    } else if (exchangeData.base === exchangeTo) {
      rate = 1 / (exchangeData.rates[exchangeFrom] || 1)
    } else {
      const fromBase = exchangeData.rates[exchangeFrom] || 1
      const toBase = exchangeData.rates[exchangeTo] || 1
      rate = toBase / fromBase
    }
    const result = amt * rate
    return result.toLocaleString(undefined, { maximumFractionDigits: 4 })
  }, [exchangeData, exchangeAmount, exchangeFrom, exchangeTo])

  const getCurrencySymbol = (code: string): string => {
    return COMMON_CURRENCIES.find(c => c.code === code)?.symbol || code
  }

  const swapCurrencies = () => {
    const f = exchangeFrom
    setExchangeFrom(exchangeTo)
    setExchangeTo(f)
  }

  const [calcMode, setCalcMode] = useState<'basic' | 'scientific' | 'programming'>('basic')

  // 主题感知颜色
  const isDark = theme === 'dark'
  const themeColors = useMemo(() => ({
    surfaceAlpha: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
    borderAlpha: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    hoverBg: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    errorBg: isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.1)',
    shadowColor: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.15)',
    displayBg: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.02)',
    memoryIndicator: isDark ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.15)',
  }), [isDark])

  const buttonStyles = useMemo(() => ({
    btn: {
      padding: '14px 0',
      fontSize: 18,
      border: 'none',
      background: 'var(--color-surface)',
      color: 'var(--text-primary)',
      cursor: 'pointer',
      borderRadius: 'var(--radius-md)',
      transition: 'all 0.15s ease',
      boxShadow: `0 1px 3px ${themeColors.shadowColor}`,
      userSelect: 'none' as const,
    },
    op: {
      padding: '14px 0',
      fontSize: 18,
      border: 'none',
      background: 'var(--accent-gradient)',
      color: '#fff',
      cursor: 'pointer',
      borderRadius: 'var(--radius-md)',
      transition: 'all 0.15s ease',
      boxShadow: `0 2px 6px ${themeColors.shadowColor}`,
      fontWeight: 600 as const,
      userSelect: 'none' as const,
    },
    func: {
      padding: '12px 0',
      fontSize: 13,
      border: 'none',
      background: 'var(--accent-bg)',
      color: 'var(--accent)',
      cursor: 'pointer',
      borderRadius: 'var(--radius-md)',
      transition: 'all 0.15s ease',
      boxShadow: `0 1px 3px ${themeColors.shadowColor}`,
      userSelect: 'none' as const,
    },
    eq: {
      padding: '14px 0',
      fontSize: 20,
      border: 'none',
      background: 'var(--gradient-success)',
      color: '#fff',
      cursor: 'pointer',
      borderRadius: 'var(--radius-md)',
      fontWeight: 'bold' as const,
      transition: 'all 0.15s ease',
      boxShadow: `0 2px 8px ${themeColors.shadowColor}`,
      userSelect: 'none' as const,
    },
    modeToggle: {
      padding: '8px 14px',
      fontSize: 12,
      border: 'none',
      background: 'var(--color-surface)',
      color: 'var(--text-secondary)',
      cursor: 'pointer',
      borderRadius: 'var(--radius-sm)',
      transition: 'all 0.2s ease',
      userSelect: 'none' as const,
    },
    tabActive: {
      background: 'var(--accent-gradient)',
      color: '#fff',
    }
  }), [themeColors])

  // 判断是否显示错误
  const isDisplayError = display === 'Error' || display === '除零错误' || display === '溢出错误' || display === '未定义' || display === '无效结果'

  if (showHistory) {
    return (
      <div ref={containerRef} className="app-container app-calculator" style={{
        background: 'var(--window-bg)',
        padding: 16,
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ color: 'var(--text-primary)', margin: 0, fontSize: 20, fontWeight: 600 }}>📋 计算历史</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              style={{
                padding: '8px 16px',
                background: 'var(--color-surface)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: 13,
                transition: 'all 0.2s ease',
              }}
              onClick={() => setShowHistory(false)}
            >返回</button>
            <button
              style={{
                padding: '8px 16px',
                background: themeColors.errorBg,
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--error)',
                cursor: 'pointer',
                fontSize: 13,
                transition: 'all 0.2s ease',
              }}
              onClick={clearHistory}
            >清空</button>
          </div>
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>
          {history.length === 0 ? (
            <div style={{
              color: 'var(--text-secondary)',
              textAlign: 'center',
              padding: 40,
              fontSize: 14,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
            }}>
              <span style={{ fontSize: 48 }}>📝</span>
              暂无历史记录
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {history.map((item, index) => (
                <div
                  key={index}
                  onClick={() => handleFromHistory(item)}
                  style={{
                    background: 'var(--color-surface)',
                    padding: 16,
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    border: `1px solid ${themeColors.borderAlpha}`,
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = themeColors.hoverBg
                    e.currentTarget.style.transform = 'translateX(4px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--color-surface)'
                    e.currentTarget.style.transform = 'translateX(0)'
                  }}
                >
                  <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 4 }}>{item.expression}</div>
                  <div style={{
                    color: 'var(--text-primary)',
                    fontSize: 20,
                    fontWeight: 600,
                  }}>= {item.result}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="app-container app-calculator" style={{
      background: 'var(--window-bg)',
      padding: 16,
      height: '100%',
      overflowY: 'auto'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <button
          style={{
            padding: '8px 16px',
            fontSize: 13,
            background: 'var(--color-surface)',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onClick={() => setShowHistory(true)}
        >
          📋 历史 ({history.length})
        </button>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            style={{
              ...buttonStyles.modeToggle,
              ...(mode === 'calc' ? buttonStyles.tabActive : {})
            }}
            onClick={() => setMode('calc')}
          >
            计算器
          </button>
          <button
            style={{
              ...buttonStyles.modeToggle,
              ...(mode === 'exchange' ? buttonStyles.tabActive : {})
            }}
            onClick={() => {
              setMode('exchange')
              fetchExchangeRates(exchangeFrom)
            }}
          >
            💱 汇率
          </button>
          <button
            style={{
              ...buttonStyles.modeToggle,
              display: mode === 'calc' ? 'inline-block' : 'none',
              ...(angleMode === 'rad' ? buttonStyles.tabActive : {})
            }}
            onClick={() => setAngleMode(angleMode === 'rad' ? 'deg' : 'rad')}
          >
            {angleMode === 'rad' ? 'Rad' : 'Deg'}
          </button>
        </div>
      </div>

      {mode === 'exchange' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
          <div style={{
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius-lg)',
            padding: 20,
            border: `1px solid ${themeColors.borderAlpha}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <label style={{ color: 'var(--text-secondary)', fontSize: 13 }}>源货币</label>
              <select
                value={exchangeFrom}
                onChange={(e) => {
                  const v = e.target.value
                  setExchangeFrom(v)
                  fetchExchangeRates(v)
                }}
                style={{
                  background: 'var(--window-bg)',
                  color: 'var(--text-primary)',
                  border: `1px solid ${themeColors.borderAlpha}`,
                  borderRadius: 'var(--radius-sm)',
                  padding: '6px 10px',
                  fontSize: 14,
                  outline: 'none',
                }}
              >
                {COMMON_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.symbol} {c.name} ({c.code})</option>
                ))}
              </select>
            </div>
            <input
              type="number"
              value={exchangeAmount}
              onChange={(e) => setExchangeAmount(e.target.value)}
              placeholder="输入金额"
              style={{
                width: '100%',
                background: 'transparent',
                color: 'var(--text-primary)',
                border: 'none',
                borderBottom: `2px solid ${themeColors.borderAlpha}`,
                fontSize: 32,
                fontWeight: 300,
                textAlign: 'right',
                outline: 'none',
                padding: '8px 0',
                letterSpacing: '-1px',
              }}
            />
          </div>

          <div style={{ textAlign: 'center' }}>
            <button
              onClick={swapCurrencies}
              style={{
                background: 'var(--accent-gradient)',
                border: 'none',
                color: '#fff',
                padding: '10px 24px',
                borderRadius: 'var(--radius-md)',
                fontSize: 16,
                cursor: 'pointer',
                boxShadow: `0 2px 8px ${themeColors.shadowColor}`,
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
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius-lg)',
            padding: 20,
            border: `1px solid ${themeColors.borderAlpha}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <label style={{ color: 'var(--text-secondary)', fontSize: 13 }}>目标货币</label>
              <select
                value={exchangeTo}
                onChange={(e) => setExchangeTo(e.target.value)}
                style={{
                  background: 'var(--window-bg)',
                  color: 'var(--text-primary)',
                  border: `1px solid ${themeColors.borderAlpha}`,
                  borderRadius: 'var(--radius-sm)',
                  padding: '6px 10px',
                  fontSize: 14,
                  outline: 'none',
                }}
              >
                {COMMON_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.symbol} {c.name} ({c.code})</option>
                ))}
              </select>
            </div>
            <div style={{
              fontSize: 32,
              fontWeight: 300,
              textAlign: 'right',
              padding: '8px 0',
              color: 'var(--text-primary)',
              letterSpacing: '-1px',
            }}>
              {exchangeLoading ? '加载中...' : `${getCurrencySymbol(exchangeTo)} ${getExchangeResult()}`}
            </div>
          </div>

          {exchangeError && (
            <div style={{
              background: themeColors.errorBg,
              color: 'var(--error)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: 13,
              textAlign: 'center',
            }}>
              {exchangeError}
            </div>
          )}

          {exchangeData && !exchangeLoading && (
            <div style={{
              background: 'var(--color-surface)',
              color: 'var(--text-secondary)',
              padding: 12,
              borderRadius: 'var(--radius-md)',
              fontSize: 12,
              textAlign: 'center',
              border: `1px solid ${themeColors.borderAlpha}`,
            }}>
              汇率基准：{exchangeData.base} · 更新于 {new Date(exchangeData.timestamp * 1000).toLocaleString()}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginTop: 4 }}>
            <InteractiveButton style={buttonStyles.btn} onClick={() => setExchangeAmount(exchangeAmount + '1')}>1</InteractiveButton>
            <InteractiveButton style={buttonStyles.btn} onClick={() => setExchangeAmount(exchangeAmount + '2')}>2</InteractiveButton>
            <InteractiveButton style={buttonStyles.btn} onClick={() => setExchangeAmount(exchangeAmount + '3')}>3</InteractiveButton>
            <InteractiveButton style={buttonStyles.btn} onClick={() => setExchangeAmount(exchangeAmount + '4')}>4</InteractiveButton>
            <InteractiveButton style={buttonStyles.btn} onClick={() => setExchangeAmount(exchangeAmount + '5')}>5</InteractiveButton>
            <InteractiveButton style={buttonStyles.btn} onClick={() => setExchangeAmount(exchangeAmount + '6')}>6</InteractiveButton>
            <InteractiveButton style={buttonStyles.btn} onClick={() => setExchangeAmount(exchangeAmount + '7')}>7</InteractiveButton>
            <InteractiveButton style={buttonStyles.btn} onClick={() => setExchangeAmount(exchangeAmount + '8')}>8</InteractiveButton>
            <InteractiveButton style={buttonStyles.btn} onClick={() => setExchangeAmount(exchangeAmount + '9')}>9</InteractiveButton>
            <InteractiveButton style={buttonStyles.btn} onClick={() => setExchangeAmount(exchangeAmount + '0')}>0</InteractiveButton>
            <InteractiveButton style={buttonStyles.func} onClick={() => setExchangeAmount('')}>清空</InteractiveButton>
            <InteractiveButton style={buttonStyles.func} onClick={() => setExchangeAmount(exchangeAmount.slice(0, -1))}>⌫</InteractiveButton>
            <InteractiveButton style={buttonStyles.func} onClick={() => setExchangeAmount(exchangeAmount + '.')}>.</InteractiveButton>
            <InteractiveButton style={buttonStyles.eq} onClick={() => fetchExchangeRates(exchangeFrom)}>刷新</InteractiveButton>
            <InteractiveButton style={buttonStyles.op} onClick={swapCurrencies}>⇅</InteractiveButton>
          </div>
        </div>
      ) : null}

      {mode === 'calc' && (
        <>
      {/* 显示屏 */}
      <div className="app-calc-display" style={{
        background: themeColors.displayBg,
        borderRadius: 'var(--radius-lg)',
        padding: '20px 16px',
        marginBottom: 12,
        textAlign: 'right',
        minHeight: 100,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        border: `1px solid ${themeColors.borderAlpha}`,
        position: 'relative',
      }}>
        {/* 记忆指示器 */}
        {memory !== 0 && (
          <div style={{
            position: 'absolute',
            top: 8,
            left: 12,
            fontSize: 11,
            color: 'var(--accent)',
            background: themeColors.memoryIndicator,
            padding: '2px 8px',
            borderRadius: 10,
            fontWeight: 600,
          }}>M</div>
        )}
        {/* 键盘提示 */}
        <div style={{
          position: 'absolute',
          top: 8,
          right: 12,
          fontSize: 10,
          color: 'var(--text-secondary)',
          opacity: 0.5,
        }}>⌨ 键盘可用</div>
        <div style={{ color: 'var(--text-secondary)', fontSize: 14, minHeight: 22, wordBreak: 'break-all' }}>{expression}</div>
        <div style={{
          color: isDisplayError ? 'var(--error)' : 'var(--text-primary)',
          fontSize: display.length > 12 ? 28 : display.length > 8 ? 34 : 40,
          fontWeight: 300,
          wordBreak: 'break-all',
          letterSpacing: '-1px',
          transition: 'color 0.2s ease',
        }}>{display}</div>
      </div>

      {/* 模式切换 */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
        <button
          style={{
            ...buttonStyles.modeToggle,
            ...(calcMode === 'basic' ? buttonStyles.tabActive : {})
          }}
          onClick={() => setCalcMode('basic')}
        >
          基本
        </button>
        <button
          style={{
            ...buttonStyles.modeToggle,
            ...(calcMode === 'scientific' ? buttonStyles.tabActive : {})
          }}
          onClick={() => setCalcMode('scientific')}
        >
          科学
        </button>
        <button
          style={{
            ...buttonStyles.modeToggle,
            ...(calcMode === 'programming' ? buttonStyles.tabActive : {})
          }}
          onClick={() => setCalcMode('programming')}
        >
          编程
        </button>
      </div>

      {calcMode === 'basic' && (
        <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 8 }}>
        <InteractiveButton style={buttonStyles.func} onClick={handleClear} dataKey="Escape">C</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={handleClearEntry}>CE</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={handleBackspace} dataKey="Backspace">⌫</InteractiveButton>
        <InteractiveButton style={buttonStyles.op} onClick={() => handleOperator('÷')} dataKey="/">÷</InteractiveButton>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 8 }}>
        <InteractiveButton style={buttonStyles.btn} onClick={() => handleNumber('7')} dataKey="7">7</InteractiveButton>
        <InteractiveButton style={buttonStyles.btn} onClick={() => handleNumber('8')} dataKey="8">8</InteractiveButton>
        <InteractiveButton style={buttonStyles.btn} onClick={() => handleNumber('9')} dataKey="9">9</InteractiveButton>
        <InteractiveButton style={buttonStyles.op} onClick={() => handleOperator('×')} dataKey="*">×</InteractiveButton>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 8 }}>
        <InteractiveButton style={buttonStyles.btn} onClick={() => handleNumber('4')} dataKey="4">4</InteractiveButton>
        <InteractiveButton style={buttonStyles.btn} onClick={() => handleNumber('5')} dataKey="5">5</InteractiveButton>
        <InteractiveButton style={buttonStyles.btn} onClick={() => handleNumber('6')} dataKey="6">6</InteractiveButton>
        <InteractiveButton style={buttonStyles.op} onClick={() => handleOperator('-')} dataKey="-">−</InteractiveButton>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 8 }}>
        <InteractiveButton style={buttonStyles.btn} onClick={() => handleNumber('1')} dataKey="1">1</InteractiveButton>
        <InteractiveButton style={buttonStyles.btn} onClick={() => handleNumber('2')} dataKey="2">2</InteractiveButton>
        <InteractiveButton style={buttonStyles.btn} onClick={() => handleNumber('3')} dataKey="3">3</InteractiveButton>
        <InteractiveButton style={buttonStyles.op} onClick={() => handleOperator('+')} dataKey="+">+</InteractiveButton>
      </div>
      {/* 增加 % 和 √ 按钮到基本模式 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 8 }}>
        <InteractiveButton style={buttonStyles.func} onClick={handlePercent} dataKey="%">%</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={() => handleUnary(Math.sqrt)}>√</InteractiveButton>
        <InteractiveButton style={buttonStyles.btn} onClick={handleSign}>±</InteractiveButton>
        <InteractiveButton style={buttonStyles.btn} onClick={() => handleNumber('0')} dataKey="0">0</InteractiveButton>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        <InteractiveButton style={buttonStyles.btn} onClick={handleDecimal} dataKey=".">.</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={() => handleConstant(String(Math.PI))}>π</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={() => handleConstant(String(Math.E))}>e</InteractiveButton>
        <InteractiveButton style={buttonStyles.eq} onClick={handleEqual} dataKey="Enter">=</InteractiveButton>
      </div>
        </>
      )}

      {calcMode === 'scientific' && (
        <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 8 }}>
        <InteractiveButton style={buttonStyles.func} onClick={handleClear} dataKey="Escape">C</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={handleClearEntry}>CE</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={handleBackspace} dataKey="Backspace">⌫</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={handlePercent} dataKey="%">%</InteractiveButton>
        <InteractiveButton style={buttonStyles.op} onClick={() => handleOperator('÷')} dataKey="/">÷</InteractiveButton>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 8 }}>
        <InteractiveButton style={buttonStyles.func} onClick={() => handleUnary((x) => x * x)}>x²</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={() => handleUnary((x) => x * x * x)}>x³</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={() => handleOperator('**')} dataKey="^">xⁿ</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={() => handleUnary(Math.sqrt)}>√</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={handleCubeRoot}>∛</InteractiveButton>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 8 }}>
        <InteractiveButton style={buttonStyles.func} onClick={() => handleUnary((x) => Math.sin(toRad(x)))}>sin</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={() => handleUnary((x) => Math.cos(toRad(x)))}>cos</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={handleTan}>tan</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={handleAsin}>sin⁻¹</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={handleAcos}>cos⁻¹</InteractiveButton>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 8 }}>
        <InteractiveButton style={buttonStyles.btn} onClick={() => handleNumber('7')} dataKey="7">7</InteractiveButton>
        <InteractiveButton style={buttonStyles.btn} onClick={() => handleNumber('8')} dataKey="8">8</InteractiveButton>
        <InteractiveButton style={buttonStyles.btn} onClick={() => handleNumber('9')} dataKey="9">9</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={handleAtan}>tan⁻¹</InteractiveButton>
        <InteractiveButton style={buttonStyles.op} onClick={() => handleOperator('×')} dataKey="*">×</InteractiveButton>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 8 }}>
        <InteractiveButton style={buttonStyles.btn} onClick={() => handleNumber('4')} dataKey="4">4</InteractiveButton>
        <InteractiveButton style={buttonStyles.btn} onClick={() => handleNumber('5')} dataKey="5">5</InteractiveButton>
        <InteractiveButton style={buttonStyles.btn} onClick={() => handleNumber('6')} dataKey="6">6</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={handleFactorial}>x!</InteractiveButton>
        <InteractiveButton style={buttonStyles.op} onClick={() => handleOperator('-')} dataKey="-">−</InteractiveButton>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 8 }}>
        <InteractiveButton style={buttonStyles.btn} onClick={() => handleNumber('1')} dataKey="1">1</InteractiveButton>
        <InteractiveButton style={buttonStyles.btn} onClick={() => handleNumber('2')} dataKey="2">2</InteractiveButton>
        <InteractiveButton style={buttonStyles.btn} onClick={() => handleNumber('3')} dataKey="3">3</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={handleAbs}>|x|</InteractiveButton>
        <InteractiveButton style={buttonStyles.op} onClick={() => handleOperator('+')} dataKey="+">+</InteractiveButton>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
        <InteractiveButton style={buttonStyles.btn} onClick={handleSign}>±</InteractiveButton>
        <InteractiveButton style={buttonStyles.btn} onClick={() => handleNumber('0')} dataKey="0">0</InteractiveButton>
        <InteractiveButton style={buttonStyles.btn} onClick={handleDecimal} dataKey=".">.</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={() => handleConstant(String(Math.PI))}>π</InteractiveButton>
        <InteractiveButton style={buttonStyles.eq} onClick={handleEqual} dataKey="Enter">=</InteractiveButton>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 8, marginTop: 8 }}>
        <InteractiveButton style={buttonStyles.func} onClick={() => handleUnary(Math.log)}>ln</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={() => handleUnary(Math.log10)}>log</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={handleExp}>eˣ</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={handle10x}>10ˣ</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={handleReciprocal}>1/x</InteractiveButton>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 8 }}>
        <InteractiveButton style={buttonStyles.func} onClick={handleMemoryClear}>MC</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={handleMemoryRecall}>MR</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={handleMemoryAdd}>M+</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={handleMemorySubtract}>M−</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={handleSignMemory}>MS</InteractiveButton>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
        <InteractiveButton style={buttonStyles.func} onClick={handleDegrees}>DEG</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={handleRadians}>RAD</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={handleFloor}>floor</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={handleCeil}>ceil</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={handleRound}>round</InteractiveButton>
      </div>
        </>
      )}

      {calcMode === 'programming' && (
        <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 8 }}>
        <InteractiveButton style={buttonStyles.func} onClick={handleClear} dataKey="Escape">C</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={handleClearEntry}>CE</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={handleBackspace} dataKey="Backspace">⌫</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={handleMod}>MOD</InteractiveButton>
        <InteractiveButton style={buttonStyles.op} onClick={() => handleOperator('÷')} dataKey="/">÷</InteractiveButton>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 8 }}>
        <InteractiveButton style={buttonStyles.func} onClick={handleBinary}>BIN</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={handleOctal}>OCT</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={handleHex}>HEX</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={() => handleFromBase(16)}>FROM</InteractiveButton>
        <InteractiveButton style={buttonStyles.op} onClick={() => handleOperator('×')} dataKey="*">×</InteractiveButton>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 8 }}>
        <InteractiveButton style={buttonStyles.func} onClick={handleLog2}>LOG2</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={handleLog1p}>LOG1P</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={handleExpm1}>EXPM1</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={handle10pow}>10^X</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={handleYx}>Y^X</InteractiveButton>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 8 }}>
        <InteractiveButton style={buttonStyles.btn} onClick={() => handleNumber('7')} dataKey="7">7</InteractiveButton>
        <InteractiveButton style={buttonStyles.btn} onClick={() => handleNumber('8')} dataKey="8">8</InteractiveButton>
        <InteractiveButton style={buttonStyles.btn} onClick={() => handleNumber('9')} dataKey="9">9</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={() => handleUnary((x) => x * x)}>x²</InteractiveButton>
        <InteractiveButton style={buttonStyles.op} onClick={() => handleOperator('-')} dataKey="-">−</InteractiveButton>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 8 }}>
        <InteractiveButton style={buttonStyles.btn} onClick={() => handleNumber('4')} dataKey="4">4</InteractiveButton>
        <InteractiveButton style={buttonStyles.btn} onClick={() => handleNumber('5')} dataKey="5">5</InteractiveButton>
        <InteractiveButton style={buttonStyles.btn} onClick={() => handleNumber('6')} dataKey="6">6</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={() => handleUnary(Math.sqrt)}>√</InteractiveButton>
        <InteractiveButton style={buttonStyles.op} onClick={() => handleOperator('+')} dataKey="+">+</InteractiveButton>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 8 }}>
        <InteractiveButton style={buttonStyles.btn} onClick={() => handleNumber('1')} dataKey="1">1</InteractiveButton>
        <InteractiveButton style={buttonStyles.btn} onClick={() => handleNumber('2')} dataKey="2">2</InteractiveButton>
        <InteractiveButton style={buttonStyles.btn} onClick={() => handleNumber('3')} dataKey="3">3</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={handleReciprocal}>1/x</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={handleOpenParen} dataKey="(">(</InteractiveButton>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
        <InteractiveButton style={buttonStyles.btn} onClick={handleSign}>±</InteractiveButton>
        <InteractiveButton style={buttonStyles.btn} onClick={() => handleNumber('0')} dataKey="0">0</InteractiveButton>
        <InteractiveButton style={buttonStyles.btn} onClick={handleDecimal} dataKey=".">.</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={handleCloseParen} dataKey=")">)</InteractiveButton>
        <InteractiveButton style={buttonStyles.eq} onClick={handleEqual} dataKey="Enter">=</InteractiveButton>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 8, marginTop: 8 }}>
        <InteractiveButton style={buttonStyles.func} onClick={handleSinh}>sinh</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={handleCosh}>cosh</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={handleTanH}>tanh</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={() => handleConstant(String(Math.PI))}>π</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={() => handleConstant(String(Math.E))}>e</InteractiveButton>
      </div>
        </>
      )}
        </>
      )}
    </div>
  )
}
